import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import aiService from '@services/aiService';
import { useAI } from '@context/AIContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { trackAIConversationStarted } from '@services/analyticsService';
import LuxuryBackground from '../components/layout/LuxuryBackground';
import Header from '../components/concierge/Header';
import LoadingState from '../components/concierge/LoadingState';
import Sidebar from '../components/concierge/Sidebar';
import { INPUT_PLACEHOLDERS, WIZARD_STEPS } from '../components/concierge/constants';
import { buildRecommendationSessions } from '../components/concierge/utils';
import { getSessionId } from '../hooks/usePreferenceTracking';

const DiscoveryHero = lazy(() => import('../components/concierge/DiscoveryHero'));
const GiftWizard = lazy(() => import('../components/concierge/GiftWizard'));
const RecommendationWorkspace = lazy(() => import('../components/concierge/RecommendationWorkspace'));

const DISCOVERY_DEFAULTS = {
  recommendedToday: [],
  ceoPicks: [],
  trendingLuxury: [],
  giftFinder: [],
  executiveEssentials: [],
  newArrivals: [],
};

export default function Concierge() {
  const {
    addTimelineEvent,
    aiHealth,
    clearMemory,
    endSession,
    exportMemory,
    journeyStage,
    loading,
    memory,
    messages,
    sessionData,
    sessionGoal,
    setMessages,
    sendMessage,
    statusMessage,
    statusStep,
    timeline,
    updateMemory,
  } = useAI();

  const navigate = useNavigate();
  const { addToCart, items: cartItems = [] } = useCart();
  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const [compareProducts, setCompareProducts] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [input, setInput] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [preChatRecs, setPreChatRecs] = useState(DISCOVERY_DEFAULTS);
  const [wizardData, setWizardData] = useState({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const inputRef = useRef(null);
  const workspaceRef = useRef(null);

  const sessions = useMemo(
    () => buildRecommendationSessions(messages, sessionData, sessionGoal),
    [messages, sessionData, sessionGoal],
  );

  const hasStarted = useMemo(
    () => messages?.some(message => message?.role === 'user'),
    [messages],
  );

  useEffect(() => {
    const syncDarkMode = () => setIsDark(document.documentElement.classList.contains('dark'));
    syncDarkMode();
    const observer = new MutationObserver(syncDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex(index => (index + 1) % INPUT_PLACEHOLDERS.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/preferences/concierge-discovery', { headers: { 'x-session-id': getSessionId() } })
      .then(response => {
        if (mounted && response.data?.success) {
          setPreChatRecs({ ...DISCOVERY_DEFAULTS, ...response.data.data });
        }
      })
      .catch(() => {});

    trackAIConversationStarted();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('nexora_concierge_prompt');
    const pendingProduct = sessionStorage.getItem('nexora_concierge_product');
    if (!pendingPrompt) return undefined;

    sessionStorage.removeItem('nexora_concierge_prompt');
    let intentOverride = null;

    if (pendingProduct) {
      sessionStorage.removeItem('nexora_concierge_product');
      try {
        const product = JSON.parse(pendingProduct);
        intentOverride = {
          category: product.category?.name || null,
          preferredBrands: product.brand ? [product.brand] : [],
          productId: product._id || null,
        };
      } catch {
        intentOverride = null;
      }
    }

    const timer = window.setTimeout(() => {
      sendMessage(pendingPrompt, intentOverride);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [sendMessage]);

  useEffect(() => {
    const lastChild = workspaceRef.current?.lastElementChild;
    lastChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [sessions.length, compareData, statusMessage]);

  const handleSendMessage = useCallback(async (text, intentOverride = null) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setCompareData(null);
    setCompareProducts([]);
    await sendMessage(userText, intentOverride);
  }, [input, loading, sendMessage]);

  const removeMemoryKey = useCallback((key) => {
    const emptyValue = ['preferredBrands', 'colors', 'materials'].includes(key) ? [] : null;
    updateMemory({ [key]: emptyValue });
  }, [updateMemory]);

  const handleToggleCompare = useCallback((product) => {
    setCompareProducts(previous => {
      const exists = previous.some(item => item._id === product._id);
      if (exists) return previous.filter(item => item._id !== product._id);
      if (previous.length >= 3) return [...previous.slice(1), product];
      return [...previous, product];
    });
    setCompareData(null);
    addTimelineEvent?.('compare', `Selected ${product.name} for comparison`);
  }, [addTimelineEvent]);

  const runCompare = useCallback(async () => {
    if (compareProducts.length < 2) return;
    setCompareLoading(true);

    try {
      const response = await aiService.compareProducts(compareProducts.map(product => product._id));
      setCompareData(response.data?.data);
      addTimelineEvent?.('compare', `Comparison ready for ${compareProducts.length} products`);
    } catch {
      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          text: 'The comparison service is temporarily unavailable. Please try again in a moment.',
          products: [],
          actions: [],
        },
      ]);
    } finally {
      setCompareLoading(false);
    }
  }, [addTimelineEvent, compareProducts, setMessages]);

  const startWizard = useCallback(() => {
    setWizardOpen(true);
    setWizardStep(0);
    setWizardData({});
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

  const handleWizardSelection = useCallback((value) => {
    const step = WIZARD_STEPS[wizardStep];
    const nextData = { ...wizardData, [step.id]: value };
    setWizardData(nextData);
    updateMemory({ [step.id]: value });

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(stepIndex => stepIndex + 1);
      return;
    }

    setWizardOpen(false);
    const budget = nextData.budget?.replace(/[^\d]/g, '').trim();
    const prompt = `Gift for a ${nextData.recipient}. Budget ${nextData.budget}. Category: ${nextData.category}. Style: ${nextData.personality}.`;

    handleSendMessage(prompt, {
      budget,
      category: nextData.category,
      personality: nextData.personality,
      purpose: 'gift',
      recipient: nextData.recipient,
    });

    axios.post('/api/preferences/track', {
      sessionId: getSessionId(),
      event: 'gift_finder',
      data: {
        budget,
        personality: nextData.personality,
        recipient: nextData.recipient,
      },
    }).catch(() => {});
  }, [handleSendMessage, updateMemory, wizardData, wizardStep]);

  const handleAction = useCallback((action) => {
    if (!action) return;

    if (action === 'Gift Finder' || action === 'Find Gifts') {
      startWizard();
      return;
    }

    if (action === 'Compare Products') {
      runCompare();
      return;
    }

    if (action === 'Checkout') {
      navigate('/checkout');
      return;
    }

    if (action === 'Continue Shopping') {
      navigate('/products');
      return;
    }

    handleSendMessage(action);
  }, [handleSendMessage, navigate, runCompare, startWizard]);

  const handleFindSimilar = useCallback((product) => {
    if (product?._id) {
      handleSendMessage(`Find similar luxury options to ${product.name}.`, {
        category: product.category?.name || null,
        preferredBrands: product.brand ? [product.brand] : [],
        productId: product._id,
      });
      return;
    }

    const latestSession = sessions[sessions.length - 1];
    const anchor = compareProducts[0] || latestSession?.products?.[0];
    handleSendMessage(anchor ? `Find similar luxury options to ${anchor.name}.` : 'Find similar products for my current shopping goal.');
  }, [compareProducts, handleSendMessage, sessions]);

  const handleExploreCollection = useCallback(() => {
    handleSendMessage('Explore this collection further and show the strongest next recommendations.');
  }, [handleSendMessage]);

  const handleSaveSession = useCallback(() => {
    if (typeof exportMemory === 'function') {
      try {
        exportMemory();
        return;
      } catch {
        // Fall through to browser download.
      }
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      memory,
      sessionData,
      sessionGoal,
      sessions,
      timeline,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexora-concierge-session.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [exportMemory, memory, sessionData, sessionGoal, sessions, timeline]);

  const handleStartOver = useCallback(() => {
    endSession?.();
    clearMemory?.();
    setCompareData(null);
    setCompareProducts([]);
    setInput('');
  }, [clearMemory, endSession]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const actionProps = useMemo(() => ({
    cartCount: cartItems.length,
    compareCount: compareProducts.length,
    compareLoading,
    onCheckout: () => navigate('/checkout'),
    onCompare: runCompare,
    onContinueShopping: () => navigate('/products'),
    onExploreCollection: handleExploreCollection,
    onFindSimilar: () => handleFindSimilar(),
    onSaveSession: handleSaveSession,
  }), [
    cartItems.length,
    compareLoading,
    compareProducts.length,
    handleExploreCollection,
    handleFindSimilar,
    handleSaveSession,
    navigate,
    runCompare,
  ]);

  if (wizardOpen) {
    return (
      <LuxuryBackground isDark={isDark}>
        <Suspense fallback={<LoadingState label="Opening gift concierge" />}>
          <GiftWizard
            onClose={closeWizard}
            onSelect={handleWizardSelection}
            stepIndex={wizardStep}
            wizardData={wizardData}
          />
        </Suspense>
      </LuxuryBackground>
    );
  }

  return (
    <LuxuryBackground isDark={isDark}>
      {!hasStarted ? (
        <Suspense fallback={<LoadingState />}>
          <DiscoveryHero
            aiHealth={aiHealth}
            input={input}
            inputRef={inputRef}
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onSelectCollection={handleSendMessage}
            onSend={handleSendMessage}
            onStartWizard={startWizard}
            placeholder={INPUT_PLACEHOLDERS[placeholderIndex]}
            preChatRecs={preChatRecs}
          />
        </Suspense>
      ) : (
        <div className="min-h-screen pb-8 pt-20 font-jakarta text-black dark:text-white">
          <Header
            aiHealth={aiHealth}
            cartCount={cartItems.length}
            currentStage={journeyStage}
            onExportMemory={handleSaveSession}
            onStartOver={handleStartOver}
            sessionGoal={sessionGoal}
          />
          <div className="mx-auto grid max-w-[1680px] grid-cols-1 gap-5 px-4 py-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Suspense fallback={<LoadingState />}>
              <RecommendationWorkspace
                aiHealth={aiHealth}
                compareData={compareData}
                compareLoading={compareLoading}
                compareProducts={compareProducts}
                currentStage={journeyStage}
                input={input}
                inputRef={inputRef}
                isInWishlist={isInWishlist}
                loading={loading}
                onAction={handleAction}
                onAddCart={addToCart}
                onCloseCompare={() => setCompareData(null)}
                onCompare={handleToggleCompare}
                onFindSimilar={handleFindSimilar}
                onInputChange={setInput}
                onKeyDown={handleKeyDown}
                onRetry={handleSendMessage}
                onRunCompare={runCompare}
                onSend={handleSendMessage}
                onToggleCompare={handleToggleCompare}
                onToggleWishlist={toggleWishlist}
                scrollRef={workspaceRef}
                sessionData={sessionData}
                sessionGoal={sessionGoal}
                sessions={sessions}
                statusMessage={statusMessage}
                statusStep={statusStep}
              />
            </Suspense>
            <Sidebar
              actionProps={actionProps}
              journeyStage={journeyStage}
              memory={memory}
              onRemoveMemoryKey={removeMemoryKey}
              sessionData={sessionData}
              timeline={timeline}
            />
          </div>
        </div>
      )}
    </LuxuryBackground>
  );
}
