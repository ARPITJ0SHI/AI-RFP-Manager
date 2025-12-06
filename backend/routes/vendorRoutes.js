const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/stats', vendorController.getVendorStats);
router.post('/', vendorController.createVendor);
router.get('/', vendorController.getAllVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
