const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfpController');
const proposalController = require('../controllers/proposalController');

router.get('/stats', rfpController.getRFPStats);
router.post('/', rfpController.createRFP);
router.get('/', rfpController.getAllRFPs);
router.get('/:id', rfpController.getRFPById);
router.put('/:id', rfpController.updateRFP);
router.delete('/:id', rfpController.deleteRFP);
router.post('/:id/send', rfpController.sendRFPToVendors);
router.post('/:id/close', rfpController.closeRFP);
router.post('/:id/award', rfpController.awardRFP);
router.get('/:id/proposals', proposalController.getProposalsByRFP);
router.post('/:id/compare', proposalController.compareProposals);

// New routes for vendor matching and email workflow
router.get('/:id/matching-vendors', rfpController.getMatchingVendors);
router.post('/:id/generate-email', rfpController.generateEmailDraft);
router.post('/:id/send-email', rfpController.sendCustomEmail);

module.exports = router;
