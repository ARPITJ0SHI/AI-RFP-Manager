import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Building2, Plus, X, Mail, Phone, MapPin, Trash2, Edit2, Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VendorListProps {
    compact?: boolean;
}

const API_URL = 'http://localhost:5000/api';

const VendorList: React.FC<VendorListProps> = ({ compact = false }) => {
    const [vendors, setVendors] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        company_size: '',
        industry: '',
        products: ''
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await axios.get(`${API_URL}/vendors`);
            setVendors(res.data);
        } catch (error) {
            console.error("Error fetching vendors:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                products: formData.products.split(',').map(p => p.trim()).filter(p => p)
            };
            if (editingVendor) {
                await axios.put(`${API_URL}/vendors/${editingVendor._id}`, dataToSend);
                toast.success('Vendor updated successfully');
            } else {
                await axios.post(`${API_URL}/vendors`, dataToSend);
                toast.success('Vendor added successfully');
            }
            resetForm();
            fetchVendors();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error saving vendor');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await axios.delete(`${API_URL}/vendors/${id}`);
            toast.success('Vendor deleted');
            fetchVendors();
        } catch (error) {
            toast.error('Error deleting vendor');
        }
    };

    const handleEdit = (vendor: any) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || '',
            contact_person: vendor.contact_person || '',
            company_size: vendor.company_size || '',
            industry: vendor.industry || '',
            products: (vendor.products || []).join(', ')
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', contact_person: '', company_size: '', industry: '', products: '' });
        setShowAddForm(false);
        setEditingVendor(null);
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (compact) {
        return (
            <div className="space-y-3">
                {vendors.slice(0, 3).map((vendor, idx) => (
                    <div
                        key={vendor._id}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 group"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">{vendor.name}</p>
                                <p className="text-xs text-slate-500 truncate">{vendor.email}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <Link
                    to="/vendors"
                    className="block p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all duration-300"
                >
                    View All Vendors ({vendors.length})
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Vendor Management</h2>
                    <p className="text-slate-500 mt-1">Manage your supplier relationships</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showAddForm ? 'Cancel' : 'Add Vendor'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <h3 className="font-bold text-lg text-slate-900 mb-4">
                        {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="contact@acme.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="IT Equipment"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Company Size</label>
                                <select
                                    value={formData.company_size}
                                    onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Select size</option>
                                    <option value="Small (1-50)">Small (1-50 employees)</option>
                                    <option value="Medium (50-200)">Medium (50-200 employees)</option>
                                    <option value="Large (200+)">Large (200+ employees)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="123 Business St, City, State ZIP"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Products (comma-separated)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.products}
                                    onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="laptops, monitors, keyboards, servers"
                                />
                                <p className="text-xs text-slate-400 mt-1">Enter product keywords for matching with RFP requirements</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                            >
                                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                            </button>
                            {editingVendor && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor, idx) => (
                    <div
                        key={vendor._id}
                        className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all duration-300 group"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-600 transition-colors">{vendor.name}</h3>
                                    {vendor.industry && (
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{vendor.industry}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(vendor)}
                                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(vendor._id)}
                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{vendor.email}</span>
                            </div>
                            {vendor.phone && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <span>{vendor.phone}</span>
                                </div>
                            )}
                            {vendor.address && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{vendor.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Products Tags */}
                        {vendor.products?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Products</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {vendor.products.slice(0, 5).map((product: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                                            {product}
                                        </span>
                                    ))}
                                    {vendor.products.length > 5 && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">
                                            +{vendor.products.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {vendor.contact_person && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-400">Contact: <span className="text-slate-600 font-medium">{vendor.contact_person}</span></p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredVendors.length === 0 && !showAddForm && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-600 text-lg">
                        {searchQuery ? 'No vendors found' : 'No vendors yet'}
                    </p>
                    <p className="text-slate-400 mt-1">
                        {searchQuery ? 'Try a different search term' : 'Add your first vendor to get started'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VendorList;
