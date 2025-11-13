import React, { useState, useEffect, FC } from 'react';
import type { AiChatMessage } from '../types';
import { getAiAssistantResponse } from '../services/geminiService';
import { AiIcon, CloseIcon, SendIcon } from './icons';

export const AiAssistant: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: AiChatMessage = { role: 'user', text: input };
        // FIX: Capture the current message history before updating state to avoid sending stale data to the API.
        const currentHistory = [...messages];
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const responseText = await getAiAssistantResponse(currentHistory, currentInput);
        
        const modelMessage: AiChatMessage = { role: 'model', text: responseText };
        // FIX: Use functional update to ensure we are appending to the latest messages array.
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-end p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-surface w-full max-w-md h-[70vh] rounded-2xl flex flex-col shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AiIcon className="text-primary"/>
                        <h3 className="font-bold text-lg" id="ai-assistant-title">Tech Wisdom AI</h3>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary" aria-label="Close AI Assistant">
                        <CloseIcon/>
                    </button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-4" aria-live="polite">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-background text-text-primary rounded-bl-lg'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-2xl bg-background text-text-primary rounded-bl-lg"><span className="animate-pulse">...</span></div></div>}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                            aria-label="Your message to the AI assistant"
                        />
                        <button onClick={handleSend} disabled={isLoading} className="p-3 bg-primary text-white rounded-lg disabled:bg-gray-500" aria-label="Send message">
                            <SendIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};