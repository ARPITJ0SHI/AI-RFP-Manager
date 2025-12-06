const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const imapService = require('../services/imapService');

exports.checkInbox = async (req, res) => {
    try {
        const result = await imapService.checkInboxForProposals();
        res.json(result);
    } catch (err) {
        console.error("Error checking inbox:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProposalsByRFP = async (req, res) => {
    try {
        const proposals = await Proposal.find({ rfp: req.params.id })
            .populate('vendor')
            .sort({ receivedAt: -1 });
        res.json(proposals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProposalById = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('vendor')
            .populate('rfp');
        if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
        res.json(proposal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.simulateProposal = async (req, res) => {
    const { rfpId, vendorId, emailContent } = req.body;
    try {
        const rfp = await RFP.findById(rfpId);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        const existingProposal = await Proposal.findOne({ rfp: rfpId, vendor: vendorId });
        if (existingProposal) {
            return res.status(400).json({ error: 'Proposal from this vendor already exists for this RFP' });
        }

        const structuredData = await aiService.parseProposal(emailContent, rfp.structured_requirements);

        const proposal = new Proposal({
            rfp: rfpId,
            vendor: vendorId,
            raw_content: emailContent,
            structured_data: structuredData,
            source: 'simulation'
        });

        await proposal.save();

        const populatedProposal = await Proposal.findById(proposal._id).populate('vendor');
        res.json(populatedProposal);
    } catch (err) {
        console.error("Error simulating proposal:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.autoGenerateProposal = async (req, res) => {
    const { rfpId, vendorId } = req.body;
    try {
        const rfp = await RFP.findById(rfpId);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        const existingProposal = await Proposal.findOne({ rfp: rfpId, vendor: vendorId });
        if (existingProposal) {
            return res.status(400).json({ error: 'Proposal from this vendor already exists' });
        }

        const mockEmailContent = emailService.generateMockVendorResponse(vendor, rfp);
        const structuredData = await aiService.parseProposal(mockEmailContent, rfp.structured_requirements);

        const proposal = new Proposal({
            rfp: rfpId,
            vendor: vendorId,
            raw_content: mockEmailContent,
            structured_data: structuredData,
            source: 'simulation'
        });

        await proposal.save();

        const populatedProposal = await Proposal.findById(proposal._id).populate('vendor');
        res.json(populatedProposal);
    } catch (err) {
        console.error("Error auto-generating proposal:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.compareProposals = async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ error: 'RFP not found' });

        const proposals = await Proposal.find({ rfp: req.params.id }).populate('vendor');

        if (proposals.length === 0) {
            return res.json({ comparison: [], message: 'No proposals to compare' });
        }

        const comparison = await aiService.compareProposals(rfp, proposals);

        for (const comp of comparison) {
            const proposal = proposals.find(p => p.vendor?.name === comp.vendor);
            if (proposal) {
                proposal.score = comp.score;
                proposal.rank = comp.rank;
                proposal.analysis = comp.reason;
                await proposal.save();
            }
        }

        res.json({ comparison, proposals });
    } catch (err) {
        console.error("Error comparing proposals:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProposalStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            { status, reviewedAt: new Date() },
            { new: true }
        ).populate('vendor');

        if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
        res.json(proposal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndDelete(req.params.id);
        if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
        res.json({ message: 'Proposal deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
