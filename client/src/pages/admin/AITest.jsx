import { useState } from 'react';
import aiService from '@services/aiService';
import { BrainCircuit, Activity, Zap, Play, AlertTriangle } from 'lucide-react';

export default function AITest() {
  const [prompt, setPrompt] = useState('What is the true meaning of luxury in 3 sentences?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    try {
      const res = await aiService.testConnection(prompt);
      setResponse(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col p-8 text-white relative font-jakarta">
      <div className="mb-10">
        <h1 className="text-3xl font-playfair flex items-center gap-3 mb-2">
          <BrainCircuit className="text-[#D4AF37]" /> Gemini Connectivity Test
        </h1>
        <p className="text-[#9CA3AF] text-sm">Development only. Verify backend token generation, latency, and guardrails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-xl bg-[#111] border border-white/5">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#D4AF37] mb-4">Input Prompt</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-black border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={handleTest}
              disabled={loading}
              className="mt-4 px-6 py-3 bg-[#D4AF37] text-black text-[12px] font-bold uppercase tracking-widest rounded flex items-center gap-2 hover:bg-[#B38945] transition-colors disabled:opacity-50"
            >
              {loading ? <Activity className="animate-spin" size={16} /> : <Play size={16} />}
              Execute Gemini
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Request Failed</h4>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-xl bg-[#111] border border-white/5 flex-1 flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#D4AF37] mb-4">Gemini Response</h3>
            
            <div className="flex-1 bg-black border border-white/10 rounded-lg p-4 overflow-y-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[#6B7280]">Awaiting neural response...</div>
              ) : response ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{response.text}</div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#333]">No response data.</div>
              )}
            </div>

            {response && (
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div>
                  <span className="block text-[10px] uppercase text-[#6B7280]">Latency</span>
                  <span className="text-sm font-mono text-[#D4AF37]">{response.latency}ms</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-[#6B7280]">Prompt Tokens</span>
                  <span className="text-sm font-mono text-white">{response.usage?.promptTokenCount || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-[#6B7280]">Completion</span>
                  <span className="text-sm font-mono text-white">{response.usage?.candidatesTokenCount || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
