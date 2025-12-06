import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Send, Bot, Loader2, Sparkles, Check, User, Mail, Building2, X, Zap, ArrowRight, Users, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

interface MatchingVendor {
    _id: string;
    name: string;
    email: string;
    contact_person: string;
    products: string[];
    matchScore: number;
    matchedProducts: string[];
}

interface EmailDraft {
    subject: string;
    body: string;
}

const examplePrompts = [
    "20 laptops with 16GB RAM for the dev team",
    "Office furniture: 10 desks and 15 ergonomic chairs",
    "Networking equipment: routers, switches, cables"
];

const ChatInterface = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string | any }[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentRfpId, setCurrentRfpId] = useState<string | null>(null);
    const [matchingVendors, setMatchingVendors] = useState<MatchingVendor[]>([]);

    // UI State for Email Template
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, matchingVendors, emailDraft, showEmailModal]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async (customInput?: string) => {
        const messageToSend = customInput || input;
        if (!messageToSend.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
        setInput('');
        setLoading(true);
        setMatchingVendors([]);
        setShowEmailModal(false);
        setEmailDraft(null);

        try {
            const res = await axios.post(`${API_URL}/rfps`, { description: messageToSend });
            const rfp = res.data;
            setCurrentRfpId(rfp._id);

            // Get matching vendors
            const vendorsRes = await axios.get(`${API_URL}/rfps/${rfp._id}/matching-vendors`);
            setMatchingVendors(vendorsRes.data);

            setMessages(prev => [...prev, {
                role: 'ai',
                content: (
                    <div className="space-y-4 w-full">
                        {/* Success Header */}
                        <div className="flex items-center gap-2 text-green-600">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">RFP Created Successfully</span>
                        </div>

                        {/* RFP Card */}
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

                        {/* Action hint */}
                        {vendorsRes.data.length > 0 && (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-lg">
                                <Zap className="w-4 h-4" />
                                <span className="text-sm font-medium">{vendorsRes.data.length} vendors match your requirements. Review and send invitations below.</span>
                            </div>
                        )}
                    </div>
                )
            }]);
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

    const handleReviewAndSend = async () => {
        if (!currentRfpId) return;
        setShowEmailModal(true);
        setLoadingEmail(true);
        setEmailDraft(null);

        try {
            // Generate generic template (no vendorId)
            const res = await axios.post(`${API_URL}/rfps/${currentRfpId}/generate-email`, {});
            setEmailDraft(res.data);
        } catch (error) {
            toast.error('Failed to generate email template');
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleBulkSend = async () => {
        if (!currentRfpId || !emailDraft || matchingVendors.length === 0) return;

        if (!confirm(`Confirm sending to ${matchingVendors.length} vendors?`)) return;

        setSendingEmail(true);
        let sentCount = 0;

        try {
            for (const vendor of matchingVendors) {
                // Perform variable substitution LOCALLY
                let customizedBody = emailDraft.body;
                let customizedSubject = emailDraft.subject;

                const variables = {
                    '{{vendor_name}}': vendor.name,
                    '{{contact_person}}': vendor.contact_person || 'Procurement Team',
                    '{{vendor_email}}': vendor.email
                };

                // Replace all occurrences
                Object.entries(variables).forEach(([key, value]) => {
                    const regex = new RegExp(key, 'g');
                    customizedBody = customizedBody.replace(regex, value);
                    customizedSubject = customizedSubject.replace(regex, value);
                });

                // Send email
                await axios.post(`${API_URL}/rfps/${currentRfpId}/send-email`, {
                    vendorId: vendor._id,
                    subject: customizedSubject,
                    body: customizedBody
                });
                sentCount++;
            }
            toast.success(`Successfully dispatched ${sentCount} emails`);

            // Clear state after success
            setMatchingVendors([]);
            setShowEmailModal(false);
            setEmailDraft(null);

            // Add success message to chat
            setMessages(prev => [...prev, {
                role: 'ai',
                content: (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-semibold">RFP sent to {sentCount} vendors successfully!</span>
                    </div>
                )
            }]);

        } catch (error) {
            console.error("Bulk send error:", error);
            toast.error(`Error sending emails. Sent ${sentCount}/${matchingVendors.length}.`);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleExampleClick = (example: string) => {
        setInput(example);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
            {/* Header */}
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 min-h-[320px] max-h-[420px]">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">What do you need to procure?</h4>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm">
                            Describe your requirements in plain English. I'll convert them into a structured RFP and find matching vendors.
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

                {/* Loading state */}
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
                                <span className="text-sm text-slate-500">Analyzing requirements & finding vendors...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Matching Vendors Section */}
            {matchingVendors.length > 0 && !showEmailModal && (
                <div className="border-t border-slate-200 p-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-1.5 rounded-lg">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">
                                    {matchingVendors.length} Matching Vendor{matchingVendors.length > 1 ? 's' : ''} Found
                                </h4>
                                <p className="text-xs text-slate-500">Ready to receive your proposal</p>
                            </div>
                        </div>

                        <button
                            onClick={handleReviewAndSend}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            <span>Review & Send to All</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {matchingVendors.map(vendor => (
                            <div key={vendor._id} className="flex-shrink-0 w-48 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <h5 className="font-bold text-slate-800 text-sm truncate">{vendor.name}</h5>
                                <p className="text-xs text-slate-500 mb-2 truncate">{vendor.email}</p>
                                <div className="flex flex-wrap gap-1">
                                    {vendor.matchedProducts.slice(0, 2).map((p, i) => (
                                        <span key={i} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-600">
                                            {p}
                                        </span>
                                    ))}
                                    {vendor.matchedProducts.length > 2 && (
                                        <span className="text-[10px] text-slate-400">+{vendor.matchedProducts.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Template Review Modal Overlay */}
            {showEmailModal && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Review Email Template</h3>
                                <p className="text-xs text-slate-500">Will be sent to {matchingVendors.length} vendors</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEmailModal(false)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        {loadingEmail ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-sm font-medium text-slate-600">Generating secure template...</p>
                            </div>
                        ) : emailDraft ? (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-2xl mx-auto">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-blue-800">Template Logic</p>
                                        <p className="text-xs text-blue-600 mt-0.5">
                                            Variables like <code className="bg-white px-1 py-0.5 rounded border border-blue-200">{'{{vendor_name}}'}</code> will be automatically replaced with actual data for each vendor when sending.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Subject Template</label>
                                    <input
                                        type="text"
                                        value={emailDraft.subject}
                                        onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Body Template</label>
                                    <textarea
                                        value={emailDraft.body}
                                        onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                                        rows={12}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none font-mono text-xs leading-relaxed"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500">Failed to load template</div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={() => setShowEmailModal(false)}
                            disabled={sendingEmail}
                            className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkSend}
                            disabled={sendingEmail || !emailDraft}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            {sendingEmail ? 'Sending to all...' : `Send to ${matchingVendors.length} Vendors`}
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
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
                        disabled={showEmailModal}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading || showEmailModal}
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
