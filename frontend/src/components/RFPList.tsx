import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileText, Clock, Send, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const RFPList = () => {
    const [rfps, setRfps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRFPs();
    }, []);

    const fetchRFPs = async () => {
        try {
            const res = await axios.get(`${API_URL}/rfps`);
            setRfps(res.data);
        } catch (error) {
            console.error("Error fetching RFPs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this RFP?')) return;
        try {
            await axios.delete(`${API_URL}/rfps/${id}`);
            toast.success('RFP deleted');
            fetchRFPs();
        } catch (error) {
            toast.error('Error deleting RFP');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        <Clock className="w-3 h-3" /> Draft
                    </span>
                );
            case 'open':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        <Send className="w-3 h-3" /> Open
                    </span>
                );
            case 'closed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        <Clock className="w-3 h-3" /> Closed
                    </span>
                );
            case 'awarded':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3 h-3" /> Awarded
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (rfps.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600">No RFPs yet</p>
                <p className="text-sm text-slate-400 mt-1">Create your first RFP using the chat above</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {rfps.map((rfp, idx) => (
                <Link
                    key={rfp._id}
                    to={`/rfps/${rfp._id}`}
                    className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                    {rfp.title}
                                </h3>
                                <p className="text-sm text-slate-500 truncate mt-0.5">
                                    {rfp.structured_requirements?.items?.length || 0} items • {rfp.structured_requirements?.budget || 'Budget TBD'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {getStatusBadge(rfp.status)}
                                    {rfp.vendors?.length > 0 && (
                                        <span className="text-xs text-slate-400">
                                            {rfp.vendors.length} vendor(s) invited
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => handleDelete(rfp._id, e)}
                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="p-2 text-blue-600">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default RFPList;
