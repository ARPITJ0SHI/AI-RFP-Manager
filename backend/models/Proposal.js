const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    rfp: { type: mongoose.Schema.Types.ObjectId, ref: 'RFP', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    raw_content: { type: String },
    structured_data: { type: Object },
    score: { type: Number },
    rank: { type: Number },
    analysis: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'awarded'], default: 'pending' },
    source: { type: String, enum: ['email', 'manual', 'simulation'], default: 'simulation' },
    attachments: [{ name: String, url: String }],
    receivedAt: { type: Date, default: Date.now },
    reviewedAt: Date
});

module.exports = mongoose.model('Proposal', proposalSchema);
