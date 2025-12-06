import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Mail, BarChart2, ArrowLeft, Trophy, AlertTriangle,
    Calendar, DollarSign, Package, Send, Plus, X, Loader2,
    Sparkles, FileText, Award, ThumbsUp, Users, Zap, Building2, RefreshCw, CheckSquare, Square
} from 'lucide-react';

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

const ComparisonView = () => {
    const { id } = useParams();
    const [rfp, setRfp] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [comparison, setComparison] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [matchingVendors, setMatchingVendors] = useState<MatchingVendor[]>([]);
    const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
    const [loadingCompare, setLoadingCompare] = useState(false);
    const [showSimulateModal, setShowSimulateModal] = useState(false);
    const [simulateVendor, setSimulateVendor] = useState('');
    const [simulateContent, setSimulateContent] = useState('');
    const [loadingSimulate, setLoadingSimulate] = useState(false);

    // Email Template State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [checkingEmails, setCheckingEmails] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRFP();
            fetchProposals();
            fetchVendors();
            fetchMatchingVendors();
        }
    }, [id]);

    const handleCheckEmails = async () => {
        setCheckingEmails(true);
        try {
            const res = await axios.post(`${API_URL}/proposals/check-emails`);
            if (res.data.success) {
                if (res.data.count > 0) {
                    toast.success(`Found ${res.data.count} new proposal(s)!`);
                    // Small delay to ensure DB has committed, then refresh
                    setTimeout(async () => {
                        await fetchProposals();
                        await fetchRFP();
                    }, 500);
                } else {
                    toast.info('No new relevant emails found.');
                }
            } else {
                toast.error('Failed to check emails: ' + res.data.error);
            }
        } catch (error) {
            console.error("Error checking emails:", error);
            toast.error('Error connecting to email server');
        } finally {
            setCheckingEmails(false);
        }
    };

    const fetchRFP = async () => {
        const res = await axios.get(`${API_URL}/rfps/${id}`);
        setRfp(res.data);
    };

    const fetchProposals = async () => {
        const res = await axios.get(`${API_URL}/rfps/${id}/proposals`);
        setProposals(res.data);
    };

    const fetchVendors = async () => {
        const res = await axios.get(`${API_URL}/vendors`);
        setVendors(res.data);
    };

    const fetchMatchingVendors = async () => {
        try {
            const res = await axios.get(`${API_URL}/rfps/${id}/matching-vendors`);
            setMatchingVendors(res.data);
            setSelectedVendorIds(new Set(res.data.map((v: MatchingVendor) => v._id)));
        } catch (error) {
            console.error("Error fetching matching vendors:", error);
        }
    };

    const toggleVendorSelection = (vendorId: string) => {
        setSelectedVendorIds(prev => {
            const next = new Set(prev);
            if (next.has(vendorId)) {
                next.delete(vendorId);
            } else {
                next.add(vendorId);
            }
            return next;
        });
    };

    const selectAllVendors = () => {
        setSelectedVendorIds(new Set(matchingVendors.map(v => v._id)));
    };

    const deselectAllVendors = () => {
        setSelectedVendorIds(new Set());
    };

    const handleAwardVendor = async (vendorId: string) => {
        if (!confirm('Award this vendor?')) return;
        try {
            await axios.post(`${API_URL}/rfps/${id}/award`, { vendorId });
            toast.success('Vendor awarded!');
            fetchRFP();
        } catch (error) {
            toast.error('Failed to award vendor');
        }
    };

    const handleReviewAndSend = async () => {
        setShowEmailModal(true);
        setLoadingEmail(true);
        setEmailDraft(null);

        try {
            const res = await axios.post(`${API_URL}/rfps/${id}/generate-email`, {});
            setEmailDraft(res.data);
        } catch (error) {
            toast.error('Failed to generate email template');
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleBulkSend = async () => {
        if (!emailDraft || selectedVendorIds.size === 0) return;

        const vendorsToSend = matchingVendors.filter(v => selectedVendorIds.has(v._id));
        if (!confirm(`Confirm sending to ${vendorsToSend.length} vendors?`)) return;

        setSendingEmail(true);
        let sentCount = 0;

        try {
            for (const vendor of vendorsToSend) {
                let customizedBody = emailDraft.body;
                let customizedSubject = emailDraft.subject;

                const variables: Record<string, string> = {
                    '{{vendor_name}}': vendor.name,
                    '{{contact_person}}': vendor.contact_person || 'Procurement Team',
                    '{{vendor_email}}': vendor.email
                };

                Object.entries(variables).forEach(([key, value]) => {
                    const regex = new RegExp(key, 'g');
                    customizedBody = customizedBody.replace(regex, value);
                    customizedSubject = customizedSubject.replace(regex, value);
                });

                await axios.post(`${API_URL}/rfps/${id}/send-email`, {
                    vendorId: vendor._id,
                    subject: customizedSubject,
                    body: customizedBody
                });
                sentCount++;
            }
            toast.success(`Successfully sent ${sentCount} emails`);
            setMatchingVendors([]);
            setSelectedVendorIds(new Set());
            setShowEmailModal(false);
            setEmailDraft(null);
            fetchRFP();
        } catch (error) {
            console.error("Bulk send error:", error);
            toast.error(`Error sending emails. Sent ${sentCount}/${vendorsToSend.length}.`);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCompare = async () => {
        setLoadingCompare(true);
        try {
            const res = await axios.post(`${API_URL}/rfps/${id}/compare`);
            setComparison(res.data.comparison);
            fetchProposals();
        } catch (error) {
            console.error("Error comparing:", error);
        } finally {
            setLoadingCompare(false);
        }
    };

    const handleSimulateProposal = async () => {
        if (!simulateVendor || !simulateContent.trim()) return;
        setLoadingSimulate(true);
        try {
            await axios.post(`${API_URL}/proposals/simulate`, {
                rfpId: id,
                vendorId: simulateVendor,
                emailContent: simulateContent
            });
            toast.success('Proposal submitted successfully');
            setShowSimulateModal(false);
            setSimulateVendor('');
            setSimulateContent('');
            fetchProposals();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error submitting proposal');
        } finally {
            setLoadingSimulate(false);
        }
    };

    const handleAutoGenerate = async (vendorId: string) => {
        try {
            await axios.post(`${API_URL}/proposals/auto-generate`, {
                rfpId: id,
                vendorId: vendorId
            });
            toast.success('Proposal auto-generated');
            fetchProposals();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error generating proposal');
        }
    };

    const invitedVendorIds = new Set((rfp?.vendors || []).map((v: any) => v._id || v));
    const availableVendorsForProposal = vendors.filter(
        v => invitedVendorIds.has(v._id) && !proposals.some(p => p.vendor?._id === v._id)
    );

    if (!rfp) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500">Loading RFP...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            {/* RFP Header Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{rfp.title}</h1>
                            <p className="text-slate-600 max-w-3xl leading-relaxed">{rfp.description}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide shadow-sm border ${rfp.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            rfp.status === 'awarded' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                            {rfp.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Budget</p>
                                <p className="font-bold text-slate-900">{rfp.structured_requirements?.budget || 'TBD'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timeline</p>
                                <p className="font-bold text-slate-900">{rfp.structured_requirements?.timeline || 'Flexible'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Items</p>
                                <p className="font-bold text-slate-900">{rfp.structured_requirements?.items?.length || 0} Items</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Proposals</p>
                                <p className="font-bold text-slate-900">{proposals.length} Received</p>
                            </div>
                        </div>
                    </div>

                    {rfp.structured_requirements?.items?.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Required Items</p>
                            <div className="flex flex-wrap gap-2">
                                {rfp.structured_requirements.items.map((item: any, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-slate-700 border border-blue-100">
                                        {item.quantity}x {item.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Recommended Vendors Section - Only show for draft RFPs */}
                    {rfp.status === 'draft' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-500" /> Invite Vendors
                                </h2>
                                {matchingVendors.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={selectAllVendors} className="text-xs text-blue-600 hover:underline">All</button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={deselectAllVendors} className="text-xs text-slate-500 hover:underline">None</button>
                                    </div>
                                )}
                            </div>

                            {matchingVendors.length > 0 ? (
                                <>
                                    <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
                                        {matchingVendors.map(v => (
                                            <div
                                                key={v._id}
                                                onClick={() => toggleVendorSelection(v._id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedVendorIds.has(v._id)
                                                    ? 'bg-blue-50 border-blue-300'
                                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {selectedVendorIds.has(v._id) ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 text-sm truncate">{v.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{v.email}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex-shrink-0">
                                                        {v.matchScore} pts
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleReviewAndSend}
                                        disabled={selectedVendorIds.size === 0}
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Send to {selectedVendorIds.size} Vendor{selectedVendorIds.size !== 1 ? 's' : ''}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No matching vendors</p>
                                    <p className="text-xs mt-1">Add product keywords to vendors</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Emails Sent Notice */}
                    {rfp.status === 'open' && rfp.vendors?.length > 0 && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Mail className="w-5 h-5" />
                                <span className="font-semibold">Emails sent to {rfp.vendors.length} vendor(s)</span>
                            </div>
                            <p className="text-sm text-emerald-600 mt-1">Waiting for responses...</p>
                        </div>
                    )}

                    {/* Simulate Response Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" /> Simulate Response
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Add vendor proposals manually or auto-generate for testing.</p>

                        {availableVendorsForProposal.length > 0 ? (
                            <div className="space-y-2">
                                {availableVendorsForProposal.map(v => (
                                    <div key={v._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <span className="font-medium text-slate-700 text-sm">{v.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAutoGenerate(v._id)}
                                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all"
                                            >
                                                Auto
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSimulateVendor(v._id);
                                                    setShowSimulateModal(true);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                                            >
                                                Manual
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">All vendors have submitted proposals</p>
                        )}
                    </div>
                </div>

                {/* Proposals Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-600" />
                                Proposals <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{proposals.length}</span>
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCheckEmails}
                                    disabled={checkingEmails}
                                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${checkingEmails ? 'animate-spin' : ''}`} />
                                    {checkingEmails ? 'Checking...' : 'Check Replies'}
                                </button>
                                {proposals.length > 0 && (
                                    <button
                                        onClick={handleCompare}
                                        disabled={loadingCompare}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        {loadingCompare ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {loadingCompare ? 'Analyzing...' : 'AI Compare'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Loading Overlay */}
                        {loadingCompare && (
                            <div className="mb-6 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 flex flex-col items-center justify-center">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                <p className="font-semibold text-blue-800">AI is analyzing proposals...</p>
                                <p className="text-sm text-blue-600 mt-1">Comparing prices, delivery, and compliance</p>
                            </div>
                        )}

                        {/* Awarded Vendor Banner */}
                        {rfp.status === 'awarded' && rfp.selected_vendor && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl text-white flex items-center gap-3">
                                <Trophy className="w-8 h-8" />
                                <div>
                                    <p className="font-bold text-lg">Awarded to: {rfp.selected_vendor.name}</p>
                                    <p className="text-sm opacity-90">This RFP has been completed</p>
                                </div>
                            </div>
                        )}

                        {comparison.length > 0 && !loadingCompare && (
                            <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg">AI Recommendation</h3>
                                </div>
                                <div className="space-y-3">
                                    {comparison.map((c: any, idx: number) => (
                                        <div key={idx} className={`p-4 bg-white rounded-xl shadow-sm border transition-all ${idx === 0 ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {idx === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-900">{c.vendor}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${c.score >= 80 ? 'bg-green-100 text-green-700' :
                                                        c.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {c.score}/100
                                                    </span>
                                                    {rfp.status !== 'awarded' && (
                                                        <button
                                                            onClick={() => {
                                                                const proposal = proposals.find(p => p.vendor?.name === c.vendor);
                                                                if (proposal?.vendor?._id) handleAwardVendor(proposal.vendor._id);
                                                            }}
                                                            className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold text-xs hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center gap-1"
                                                        >
                                                            <Trophy className="w-3 h-3" />
                                                            Award
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 pl-8">{c.reason || c.recommendation}</p>
                                            {c.strengths && c.strengths.length > 0 && (
                                                <div className="mt-2 pl-8 flex flex-wrap gap-1">
                                                    {c.strengths.map((s: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                                            <ThumbsUp className="w-3 h-3" /> {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {proposals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="font-medium text-slate-600">No proposals received yet</p>
                                <p className="text-sm mt-1">Invite vendors or simulate responses</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="p-4">Vendor</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Delivery</th>
                                            <th className="p-4">Warranty</th>
                                            <th className="p-4">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {proposals.map(p => (
                                            <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-900">{p.vendor?.name}</td>
                                                <td className="p-4 font-mono text-slate-700">
                                                    ${p.structured_data?.total_price?.toLocaleString() || 'N/A'} {p.structured_data?.currency}
                                                </td>
                                                <td className="p-4 text-slate-600">{p.structured_data?.delivery_time || 'N/A'}</td>
                                                <td className="p-4 text-slate-600">{p.structured_data?.warranty_offered || 'N/A'}</td>
                                                <td className="p-4">
                                                    {p.score ? (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.score >= 80 ? 'bg-green-100 text-green-700' :
                                                            p.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {p.score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Simulate Modal */}
            {showSimulateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Simulate Vendor Response</h3>
                            <button onClick={() => setShowSimulateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor</label>
                                <select
                                    value={simulateVendor}
                                    onChange={(e) => setSimulateVendor(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Select a vendor</option>
                                    {availableVendorsForProposal.map(v => (
                                        <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Content (Proposal)</label>
                                <textarea
                                    value={simulateContent}
                                    onChange={(e) => setSimulateContent(e.target.value)}
                                    rows={10}
                                    placeholder="Paste or type the vendor's email response here..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSimulateModal(false)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSimulateProposal}
                                disabled={!simulateVendor || !simulateContent.trim() || loadingSimulate}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {loadingSimulate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Submit Proposal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Template Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Review Email Template</h3>
                                    <p className="text-sm text-slate-500">Will be sent to {matchingVendors.length} vendors</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {loadingEmail ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-sm font-medium text-slate-600">Generating template...</p>
                                </div>
                            ) : emailDraft ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                                        <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold text-blue-800">Template Variables</p>
                                            <p className="text-xs text-blue-600 mt-0.5">
                                                <code className="bg-white px-1 py-0.5 rounded border border-blue-200">{'{{vendor_name}}'}</code> and
                                                <code className="bg-white px-1 py-0.5 rounded border border-blue-200 ml-1">{'{{contact_person}}'}</code> will be replaced automatically.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Subject</label>
                                        <input
                                            type="text"
                                            value={emailDraft.subject}
                                            onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Body</label>
                                        <textarea
                                            value={emailDraft.body}
                                            onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                                            rows={14}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none font-mono text-xs leading-relaxed"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-500">Failed to load template</div>
                            )}
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
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
                                {sendingEmail ? 'Sending...' : `Send to ${matchingVendors.length} Vendors`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
