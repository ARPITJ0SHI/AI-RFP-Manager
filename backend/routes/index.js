const express = require('express');
const router = express.Router();

const rfpRoutes = require('./rfpRoutes');
const vendorRoutes = require('./vendorRoutes');
const proposalRoutes = require('./proposalRoutes');

router.use('/rfps', rfpRoutes);
router.use('/vendors', vendorRoutes);
router.use('/proposals', proposalRoutes);

module.exports = router;
