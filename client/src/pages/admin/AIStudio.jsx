// NexORA V9 — Admin AI Studio (Executive Intelligence Platform)
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Sparkles, Activity, Tag, MessageSquare, TrendingUp,
  Mail, Package, Users, BarChart2, AlertTriangle, RefreshCw
} from 'lucide-react';
import aiService from '@services/aiService';
import axios from 'axios';

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { id: 'analytics',  label: 'AI Analytics',      icon: Activity },
    { id: 'insights',   label: 'Customer Insights',  icon: Users },
    { id: 'product',    label: 'Product Studio',     icon: Tag },
    { id: 'review',     label: 'Review Analyser',    icon: MessageSquare },
    { id: 'sales',      label: 'Sales Analyst',      icon: TrendingUp },
    { id: 'revenue',    label: 'Revenue Summary',    icon: BarChart2 },
    { id: 'inventory',  label: 'Inventory Forecast', icon: Package },
    { id: 'marketing',  label: 'Marketing Studio',   icon: Mail },
    { id: 'trends',     label: 'Customer Trends',    icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen p-8 text-gray-900 dark:text-white bg-[#FDFDFD] dark:bg-[#050505] transition-colors duration-300 font-jakarta">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase mb-4"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
              <BrainCircuit size={12} /> NexORA Intelligence OS
            </div>
            <h1 className="text-4xl font-playfair tracking-tight">AI Studio</h1>
            <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Executive Intelligence Platform</p>
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono">
            Status: <span className="text-green-400">Online</span> | Failover: 3 models
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-[11px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500 dark:text-[#6B7280] hover:text-gray-900 dark:hover:text-white'
              }`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#0B0B0B] transition-colors duration-300 border border-gray-200 dark:border-white/5 rounded-2xl p-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics'  && <AnalyticsTab key="analytics" />}
            {activeTab === 'insights'   && <InsightsTab key="insights" />}
            {activeTab === 'product'    && <ProductStudioTab key="product" />}
            {activeTab === 'review'     && <ReviewAnalyserTab key="review" />}
            {activeTab === 'sales'      && <SalesAnalystTab key="sales" />}
            {activeTab === 'revenue'    && <RevenueTab key="revenue" />}
            {activeTab === 'inventory'  && <InventoryTab key="inventory" />}
            {activeTab === 'marketing'  && <MarketingTab key="marketing" />}
            {activeTab === 'trends'     && <CustomerTrendsTab key="trends" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Shared Atoms ──────────────────────────────────────────────────────────────
function StatBox({ label, value, highlight }) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#111] transition-colors duration-300'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] mb-2">{label}</p>
      <p className={`text-2xl font-mono ${highlight ? 'text-[#D4AF37]' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function ResultBox({ label, content }) {
  return (
    <div className="p-5 bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5">
      <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-[#6B7280] block mb-2">{label}</span>
      <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200">{content}</p>
    </div>
  );
}

function AINarrative({ text, loading }) {
  if (loading) return (
    <div className="p-6 bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5">
      <div className="flex items-center gap-2 text-[#D4AF37] text-[11px] uppercase tracking-widest animate-pulse">
        <Sparkles size={12} /> Generating executive insights…
      </div>
    </div>
  );
  if (!text) return null;
  return (
    <div className="p-6 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={12} className="text-[#D4AF37]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">AI Executive Analysis</span>
      </div>
      <p className="text-[13px] text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="p-5 bg-red-900/10 rounded-xl border border-red-900/30 flex items-start gap-3">
      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
      <p className="text-[12px] text-red-300">{message}</p>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    aiService.getAnalytics()
      .then(r => setData(r.data.data))
      .catch(() => setError('Analytics unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Activity className="animate-spin text-[#D4AF37]" size={28} /></div>;
  if (error)   return <ErrorBox message={error} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-xl font-playfair mb-6">Usage & Cost Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatBox label="Total Requests" value={data?.overview?.totalRequests || 0} />
        <StatBox label="Tokens Used"   value={(data?.overview?.promptTokens + data?.overview?.completionTokens)?.toLocaleString() || 0} />
        <StatBox label="Est. API Cost" value={`$${(data?.overview?.totalCost || 0).toFixed(4)}`} highlight />
        <StatBox label="Avg Latency"   value={`${(data?.overview?.avgLatency || 0).toFixed(0)}ms`} />
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] mb-4">Endpoint Distribution</h3>
      <div className="bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5 p-6">
        {data?.endpoints?.map(ep => (
          <div key={ep._id} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-white/5 last:border-0">
            <span className="font-mono text-[12px]">{ep._id || 'Unknown'}</span>
            <span className="text-[#D4AF37] font-bold text-[12px]">{ep.count} reqs</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Customer Insights Tab ─────────────────────────────────────────────────────
function InsightsTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/preferences/analytics')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Activity className="animate-spin text-[#D4AF37]" size={28} /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-xl font-playfair mb-6">User Preference Analytics</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox label="Active Profiles" value={data?.totalProfiles || 0} highlight />
        <StatBox label="Avg Budget"      value={`₹${(data?.averageBudget || 0).toLocaleString('en-IN')}`} />
        <StatBox label="Gift Finder Uses" value={Object.values(data?.popularRecipients || {}).reduce((a, b) => a + b, 0)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5 p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] mb-4">Top Brands</h3>
          {Object.entries(data?.popularBrands || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b, c]) => (
            <div key={b} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/5 last:border-0">
              <span className="text-[12px]">{b}</span>
              <span className="text-[#D4AF37] text-[12px] font-bold">{c}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5 p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] mb-4">Gift Recipients</h3>
          {Object.entries(data?.popularRecipients || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([r, c]) => (
            <div key={r} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/5 last:border-0">
              <span className="text-[12px]">{r}</span>
              <span className="text-[#D4AF37] text-[12px] font-bold">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Product Studio ────────────────────────────────────────────────────────────
function ProductStudioTab() {
  const [productId, setProductId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  const handleGenerate = async () => {
    if (!productId.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiService.generateProductMetadata(productId.trim());
      setResult(r.data.data);
    } catch { setError('Generation failed. Verify the product ID.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-xl font-playfair mb-6">Product Metadata Generator</h2>
      <div className="flex gap-3 mb-6">
        <input type="text" value={productId} onChange={e => setProductId(e.target.value)}
          placeholder="Enter Product ID (MongoDB ObjectId)…"
          className="flex-1 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-[13px] focus:outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white" />
        <button onClick={handleGenerate} disabled={loading || !productId.trim()}
          className="px-6 py-3 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2 hover:bg-[#B38945] disabled:opacity-40 transition-colors">
          {loading ? <Activity className="animate-spin" size={14} /> : <Sparkles size={14} />} Generate
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-4">
          <ResultBox label="SEO Title" content={result.seoTitle} />
          <ResultBox label="Meta Description" content={result.metaDescription} />
          <ResultBox label="Instagram Caption" content={result.instagramCaption} />
          <div className="p-5 bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-[#6B7280] block mb-3">Tags</span>
            <div className="flex gap-2 flex-wrap">
              {result.tags?.map(t => <span key={t} className="px-3 py-1 bg-gray-200 dark:bg-white/10 rounded text-[11px]">{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Review Analyser ───────────────────────────────────────────────────────────
function ReviewAnalyserTab() {
  const [productId, setProductId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  const handleAnalyze = async () => {
    if (!productId.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiService.analyzeReviews(productId.trim());
      setResult(r.data.data);
    } catch { setError('Analysis failed. Verify the product ID.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-xl font-playfair mb-6">Review Intelligence</h2>
      <div className="flex gap-3 mb-6">
        <input type="text" value={productId} onChange={e => setProductId(e.target.value)}
          placeholder="Enter Product ID to analyse reviews…"
          className="flex-1 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-[13px] focus:outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white" />
        <button onClick={handleAnalyze} disabled={loading || !productId.trim()}
          className="px-6 py-3 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#B38945] disabled:opacity-40 transition-colors">
          {loading ? <Activity className="animate-spin" size={14} /> : 'Analyse'}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2 p-6 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-[#D4AF37]/30 rounded-xl">
            <h3 className="text-[11px] uppercase tracking-widest text-[#D4AF37] mb-2">Executive Summary</h3>
            <p className="text-[15px] font-playfair">{result.summary}</p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
              <span className="text-[10px] uppercase text-gray-500 dark:text-[#6B7280]">Sentiment Score</span>
              <span className={`text-2xl font-bold ${result.sentiment > 70 ? 'text-green-400' : result.sentiment < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                {result.sentiment}/100
              </span>
            </div>
          </div>
          <ResultBox label="Common Praise"      content={result.pros?.map(p => `• ${p}`).join('\n')} />
          <ResultBox label="Common Complaints"  content={result.cons?.map(c => `• ${c}`).join('\n')} />
        </div>
      )}
    </motion.div>
  );
}

// ── Sales Analyst ─────────────────────────────────────────────────────────────
function SalesAnalystTab() {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError]     = useState('');

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResponse('');
    try {
      const r = await aiService.analyzeSales({ note: 'Real data from NexORA database' }, query);
      setResponse(r.data.data);
    } catch { setError('Sales Analyst is temporarily unavailable.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-[500px]">
      <h2 className="text-xl font-playfair mb-6">Sales Intelligence</h2>
      <div className="flex-1 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-gray-200 dark:border-white/5 rounded-xl p-6 mb-4 overflow-y-auto">
        {loading && <p className="text-gray-500 dark:text-[#6B7280] animate-pulse text-[13px]">Analysing store metrics…</p>}
        {error && <ErrorBox message={error} />}
        {response && <p className="text-[13px] whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed">{response}</p>}
        {!loading && !error && !response && (
          <p className="text-gray-500 dark:text-[#6B7280] text-[13px]">Ask the CRO AI about store performance. e.g. &quot;Why are watch sales dropping this month?&quot;</p>
        )}
      </div>
      <div className="flex gap-3">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a question about sales data…"
          className="flex-1 bg-gray-50 dark:bg-[#111] transition-colors duration-300 border border-gray-200 dark:border-white/10 rounded-lg p-4 text-[13px] focus:outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white" />
        <button onClick={handleAsk} disabled={loading || !query.trim()}
          className="px-8 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#B38945] disabled:opacity-40 transition-colors">
          Ask
        </button>
      </div>
    </motion.div>
  );
}

// ── Revenue Summary ───────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchRevenue = () => {
    setLoading(true); setError('');
    aiService.runAdminStudioTool('revenue')
      .then(r => {
        const d = r.data.data;
        const summary = `${d.performanceSummary}\n\nBest Week: ${d.bestWeek}\nWorst Week: ${d.worstWeek}\n\nRecommendations:\n${d.recommendations?.map(x => '• ' + x).join('\n')}`;
        setData({ summary });
      })
      .catch(() => setError('Revenue data unavailable.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRevenue(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-playfair">Weekly Revenue Summary</h2>
        <button onClick={fetchRevenue} className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      <AINarrative text={data?.summary} loading={loading} />
    </motion.div>
  );
}

// ── Inventory Forecast ────────────────────────────────────────────────────────
function InventoryTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleForecast = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const r = await aiService.runAdminStudioTool('forecast');
      const d = r.data.data;
      const analysis = `Overall Health: ${d.overallHealth}\n\nActions Needed:\n${d.actions?.map(x => '• '+x).join('\n')}\n\nRestock Priority:\n${d.restockPriority?.map(x => '• '+x).join('\n')}`;
      setData({ analysis });
    } catch { setError('Inventory forecast is temporarily unavailable.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-playfair">Inventory Intelligence</h2>
        <button onClick={handleForecast} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#B38945] disabled:opacity-40 transition-colors">
          {loading ? <Activity className="animate-spin" size={13} /> : <Sparkles size={13} />}
          {loading ? 'Analysing…' : 'Generate Forecast'}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      <AINarrative text={data?.analysis} loading={false} />
    </motion.div>
  );
}

// ── Marketing Studio ──────────────────────────────────────────────────────────
function MarketingTab() {
  const [type, setType]       = useState('email');
  const [segment, setSegment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [copy, setCopy]       = useState('');
  const [error, setError]     = useState('');

  const campaignTypes = [
    { id: 'email',     label: 'Email Campaign' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'push',      label: 'Push Notification' },
  ];
  const segments = [
    { id: 'all',  label: 'All Customers' },
    { id: 'vip',  label: 'VIP Clients' },
    { id: 'gift', label: 'Gift Buyers' },
  ];

  const handleGenerate = async () => {
    setLoading(true); setError(''); setCopy('');
    try {
      const r = await aiService.runAdminStudioTool('marketing', { campaignType: type, segment });
      const d = r.data.data;
      setCopy(`Headline: ${d.headline}\n\n${d.body}\n\nCTA: ${d.cta}`);
    } catch { setError('Marketing generator is temporarily unavailable.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-xl font-playfair mb-6">Marketing Copy Studio</h2>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] block mb-3">Campaign Type</label>
          <div className="flex flex-col gap-2">
            {campaignTypes.map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`px-4 py-3 text-left rounded-lg border text-[12px] transition-all ${type === t.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-200 dark:border-white/20'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] block mb-3">Target Audience</label>
          <div className="flex flex-col gap-2">
            {segments.map(s => (
              <button key={s.id} onClick={() => setSegment(s.id)}
                className={`px-4 py-3 text-left rounded-lg border text-[12px] transition-all ${segment === s.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-200 dark:border-white/20'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleGenerate} disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#B38945] disabled:opacity-40 transition-colors mb-6">
        {loading ? <Activity className="animate-spin" size={14} /> : <Sparkles size={14} />}
        {loading ? 'Generating…' : 'Generate Copy'}
      </button>
      {error && <ErrorBox message={error} />}
      {copy && (
        <div className="p-6 bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Generated Copy</span>
          </div>
          <p className="text-[13px] whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed">{copy}</p>
          <button onClick={() => navigator.clipboard?.writeText(copy)}
            className="mt-4 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Copy to Clipboard
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Customer Trends ───────────────────────────────────────────────────────────
function CustomerTrendsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    axios.get('/api/preferences/analytics')
      .then(r => setAnalytics(r.data.data))
      .catch(() => setError('Customer data unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const generateTrends = async () => {
    if (!analytics) return;
    setAiLoading(true); setTrends('');
    try {
      const r = await aiService.runAdminStudioTool('trends', {});
      const d = r.data.data;
      const text = `Top Insights:\n${d.topInsights?.map(x=>'• '+x).join('\n')}\n\nValuable Segments:\n${d.valuableSegments?.map(x=>'• '+x).join('\n')}\n\nMerchandising Priority:\n${d.merchandisingPriority}`;
      setTrends(text);
    } catch { setError('Trend analysis temporarily unavailable.'); }
    finally { setAiLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-playfair">Customer Intelligence</h2>
        <button onClick={generateTrends} disabled={aiLoading || loading || !analytics}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#B38945] disabled:opacity-40 transition-colors">
          {aiLoading ? <Activity className="animate-spin" size={13} /> : <BrainCircuit size={13} />}
          Generate Analysis
        </button>
      </div>
      {loading && <div className="flex justify-center py-10"><Activity className="animate-spin text-[#D4AF37]" size={24} /></div>}
      {error && <ErrorBox message={error} />}
      <AINarrative text={trends} loading={aiLoading} />
      {analytics && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Total Profiles"   value={analytics.totalProfiles || 0} highlight />
          <StatBox label="Avg Budget"        value={`₹${(analytics.averageBudget || 0).toLocaleString('en-IN')}`} />
          <StatBox label="Concierge Intents" value={Object.values(analytics.popularConciergeIntents || {}).reduce((a, b) => a + b, 0)} />
          <div className="md:col-span-3 bg-gray-50 dark:bg-[#111] transition-colors duration-300 rounded-xl border border-gray-200 dark:border-white/5 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#6B7280] mb-4">Top Concierge Intents</h3>
            {Object.entries(analytics.popularConciergeIntents || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([intent, count]) => (
              <div key={intent} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/5 last:border-0">
                <span className="text-[11px] text-gray-300 truncate max-w-xs">{intent}</span>
                <span className="text-[#D4AF37] text-[11px] font-bold shrink-0 ml-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
