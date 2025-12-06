import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Send, Bot, Sparkles, Check, User, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const examplePrompts = [
    "20 laptops with 16GB RAM for the dev team",
    "Office furniture: 10 desks and 15 ergonomic chairs",
    "Networking equipment: routers, switches, cables"
];

const ChatInterface = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string | any }[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async (customInput?: string) => {
        const messageToSend = customInput || input;
        if (!messageToSend.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/rfps`, { description: messageToSend });
            const rfp = res.data;

            setMessages(prev => [...prev, {
                role: 'ai',
                content: (
                    <div className="space-y-4 w-full">
                        <div className="flex items-center gap-2 text-green-600">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">RFP Created Successfully</span>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Request for Proposal</p>
                                    <h4 className="font-bold text-lg leading-tight">{rfp.title}</h4>
                                </div>
                                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                    <p className="text-xs text-slate-400 mb-0.5">Budget</p>
                                    <p className="font-bold text-sm">{rfp.structured_requirements?.budget || 'TBD'}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                    <p className="text-xs text-slate-400 mb-0.5">Timeline</p>
                                    <p className="font-bold text-sm">{rfp.structured_requirements?.timeline || 'Flexible'}</p>
                                </div>
                            </div>

                            {rfp.structured_requirements?.items?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Items</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rfp.structured_requirements.items.map((item: any, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium">
                                                {item.quantity}× {item.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-slate-600">Redirecting to RFP management page...</p>
                    </div>
                )
            }]);

            toast.success('RFP created! Redirecting...');
            setTimeout(() => navigate(`/rfps/${rfp._id}`), 1500);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">Failed to process your request</p>
                        <p className="text-red-600 text-xs mt-1">Please check if the backend server is running at localhost:5000</p>
                    </div>
                )
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (example: string) => {
        setInput(example);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold">AI Procurement Assistant</h3>
                        <p className="text-xs text-blue-100">Describe what you need, I'll create the RFP</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 min-h-[320px] max-h-[420px]">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">What do you need to procure?</h4>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm">
                            Describe your requirements in plain English. I'll convert them into a structured RFP.
                        </p>
                        <div className="space-y-2 w-full max-w-sm">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Try an example:</p>
                            {examplePrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleExampleClick(prompt)}
                                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                                >
                                    <span>"{prompt}"</span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-slate-900 text-white px-4 py-3 rounded-2xl rounded-tr-md'
                                    : 'w-full'
                                    }`}>
                                    {typeof msg.content === 'string' ? (
                                        <p className="leading-relaxed text-sm">{msg.content}</p>
                                    ) : msg.content}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-sm text-slate-500">Creating your RFP...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Describe your procurement needs..."
                        className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
