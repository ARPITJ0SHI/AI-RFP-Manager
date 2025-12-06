const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact_person: String,
    phone: String,
    address: String,
    company_size: String,
    industry: String,
    products: [String], // Product keywords for matching
    tags: [String],
    rating: { type: Number, default: 0 },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', vendorSchema);
