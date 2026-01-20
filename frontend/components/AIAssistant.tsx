import React, { useState } from 'react';
import { Task, FollowUp } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { Button } from './Button';

interface AIAssistantProps {
  tasks: Task[];
  followUps: FollowUp[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ tasks, followUps }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const result = await generateAIResponse(finalPrompt, { tasks, followUps });
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };
  
  const quickActions = [
    { label: "Summarize today's priorities", prompt: "Based on my tasks and calls, what are my top 3 priorities for today? Give me a short, actionable summary." },
    { label: "Suggest a new task", prompt: "Based on my current workload, suggest a new task that could help me be more proactive. For example, a task about client outreach or planning." },
    { label: "Identify overdue items", prompt: "Which of my tasks or follow-ups are overdue? List them for me." },
  ];

  return (
    <div className="flex flex-col h-[70vh] max-h-[700px]">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {response && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl whitespace-pre-wrap font-sans animate-fade-in text-sm text-slate-800 leading-relaxed">
            {response}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center h-full">
             <div className="flex flex-col items-center gap-3 text-slate-400">
                <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest">Generating...</span>
             </div>
          </div>
        )}
        {!isLoading && !response && (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <div className="w-16 h-16 bg-slate-100 text-accent rounded-full flex items-center justify-center mb-4 border-4 border-slate-200 shadow-inner">
                    <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Your AI Assistant</h3>
                 <p className="text-sm text-slate-500 mt-1">Ask me anything about your tasks and clients, or use a quick action below.</p>
                 <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {quickActions.map(action => (
                        <button key={action.label} onClick={() => handleGenerate(action.prompt)} className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
                            {action.label}
                        </button>
                    ))}
                 </div>
             </div>
        )}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
                <strong>Error:</strong> {error}
            </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask your assistant anything..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-sm text-slate-700 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all resize-none shadow-inner"
            rows={2}
            disabled={isLoading}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                }
            }}
          />
          <button type="submit" disabled={isLoading || !prompt.trim()} className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center transition-opacity disabled:opacity-50 hover:bg-blue-600">
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </form>
      </div>
    </div>
  );
};
