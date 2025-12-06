const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

exports.createRFP = async (req, res) => {
    const { description } = req.body;
    try {
        const structuredData = await aiService.parseRFP(description);
        const rfp = new RFP({
            title: structuredData.title || 'New RFP',
            description: description,
            structured_requirements: structuredData,
            status: 'draft'
        });
        await rfp.save();
        res.json(rfp);
    } catch (err) {
        console.error("Error creating RFP:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllRFPs = async (req, res) => {
    try {
        const rfps = await RFP.find().populate('vendors').sort({ createdAt: -1 });
        res.json(rfps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRFPById = async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id).populate('vendors').populate('selected_vendor');
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });
        res.json(rfp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRFP = async (req, res) => {
    try {
        const rfp = await RFP.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });
        res.json(rfp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendRFPToVendors = async (req, res) => {
    const { vendorIds } = req.body;
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const vendors = await Vendor.find({ _id: { $in: vendorIds } });

        const emailResults = [];
        for (const vendor of vendors) {
            const result = await emailService.sendRFP(vendor, rfp);
            emailResults.push({ vendor: vendor.name, email: vendor.email, ...result });
        }

        rfp.vendors = vendorIds;
        rfp.status = 'open';
        rfp.emails_sent_at = new Date();
        await rfp.save();

        res.json({
            message: 'RFP sent to vendors',
            rfp,
            emailResults
        });
    } catch (err) {
        console.error("Error sending RFP:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.closeRFP = async (req, res) => {
    try {
        const rfp = await RFP.findByIdAndUpdate(
            req.params.id,
            { status: 'closed' },
            { new: true }
        );
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });
        res.json(rfp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.awardRFP = async (req, res) => {
    const { vendorId } = req.body;
    try {
        const rfp = await RFP.findByIdAndUpdate(
            req.params.id,
            { status: 'awarded', selected_vendor: vendorId },
            { new: true }
        ).populate('selected_vendor');
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });
        res.json(rfp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRFP = async (req, res) => {
    try {
        const rfp = await RFP.findByIdAndDelete(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });
        res.json({ message: 'RFP deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRFPStats = async (req, res) => {
    try {
        const total = await RFP.countDocuments();
        const draft = await RFP.countDocuments({ status: 'draft' });
        const open = await RFP.countDocuments({ status: 'open' });
        const closed = await RFP.countDocuments({ status: 'closed' });
        const awarded = await RFP.countDocuments({ status: 'awarded' });

        res.json({ total, draft, open, closed, awarded });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMatchingVendors = async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const vendors = await Vendor.find();

        const rfpKeywords = [];
        if (rfp.structured_requirements?.items) {
            rfp.structured_requirements.items.forEach(item => {
                const words = item.name.toLowerCase().split(/\s+/);
                rfpKeywords.push(...words);
                if (item.specs) {
                    const specWords = item.specs.toLowerCase().split(/[\s,]+/);
                    rfpKeywords.push(...specWords);
                }
            });
        }
        if (rfp.description) {
            const descWords = rfp.description.toLowerCase().split(/\s+/);
            rfpKeywords.push(...descWords);
        }

        const scoredVendors = vendors.map(vendor => {
            let matchCount = 0;
            const matchedProducts = [];

            (vendor.products || []).forEach(product => {
                const productLower = product.toLowerCase();
                rfpKeywords.forEach(keyword => {
                    if (keyword.length > 2 && (productLower.includes(keyword) || keyword.includes(productLower))) {
                        matchCount++;
                        if (!matchedProducts.includes(product)) {
                            matchedProducts.push(product);
                        }
                    }
                });
            });

            return {
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                contact_person: vendor.contact_person,
                products: vendor.products,
                matchScore: matchCount,
                matchedProducts
            };
        });

        const matchingVendors = scoredVendors
            .filter(v => v.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json(matchingVendors);
    } catch (err) {
        console.error("Error getting matching vendors:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.generateEmailDraft = async (req, res) => {
    const { vendorId } = req.body;
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        if (!vendorId) {
            const template = await aiService.generateEmailTemplate(rfp);
            return res.json(template);
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        const emailContent = await aiService.generateEmailDraft(rfp, vendor);
        res.json(emailContent);
    } catch (err) {
        console.error("Error generating email draft:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.sendCustomEmail = async (req, res) => {
    const { vendorId, subject, body } = req.body;
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        const result = await emailService.sendCustomEmail(vendor, subject, body);

        if (!rfp.vendors.includes(vendorId)) {
            rfp.vendors.push(vendorId);
            rfp.status = 'open';
            rfp.emails_sent_at = new Date();
            await rfp.save();
        }

        res.json({ message: 'Email sent successfully', result });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: err.message });
    }
};
