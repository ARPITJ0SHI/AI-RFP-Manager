const Vendor = require('../models/Vendor');

exports.createVendor = async (req, res) => {
    try {
        const vendor = new Vendor(req.body);
        await vendor.save();
        res.json(vendor);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Vendor with this email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.getAllVendors = async (req, res) => {
    try {
        const { search, tags } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (tags) {
            query.tags = { $in: tags.split(',') };
        }

        const vendors = await Vendor.find(query).sort({ createdAt: -1 });
        res.json(vendors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
        res.json(vendor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
        res.json(vendor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
        res.json({ message: 'Vendor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getVendorStats = async (req, res) => {
    try {
        const total = await Vendor.countDocuments();
        const recent = await Vendor.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        res.json({ total, recentlyAdded: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
