import React, { useState } from 'react';

const AIWasteAdvisor: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askAI = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a waste management advisor. A user has "${input}" as waste. Give a short, practical suggestion (2-3 sentences max) on how to recycle, donate, reuse, or dispose of it responsibly. Be direct and helpful.`
              }]
            }]
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(`API Error: ${data?.error?.message || 'Unknown error'}`);
        return;
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setResponse(text);
      } else {
        setError('No response from AI. Please try again.');
      }
    } catch {
      setError('Failed to connect to AI. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">🤖</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Waste Advisor</h2>
          <p className="text-sm text-gray-500">Powered by Google Gemini</p>
        </div>
      </div>

      <div className="flex space-x-3 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askAI()}
          placeholder="e.g. old clothes, plastic bottles, e-waste..."
          className="flex-1 px-4 py-3 border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400"
        />
        <button
          onClick={askAI}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span>Asking...</span>
            </>
          ) : (
            <span>Ask AI</span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {response && (
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-1">AI Suggestion for "{input}"</p>
              <p className="text-gray-800 text-sm leading-relaxed">{response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWasteAdvisor;
