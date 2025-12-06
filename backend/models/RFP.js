const mongoose = require('mongoose');

const rfpSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    structured_requirements: { type: Object },
    status: { type: String, enum: ['draft', 'open', 'closed', 'awarded'], default: 'draft' },
    budget_min: Number,
    budget_max: Number,
    deadline: Date,
    created_by: String,
    vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
    selected_vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    emails_sent_at: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

rfpSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('RFP', rfpSchema);
