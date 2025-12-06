const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

router.post('/simulate', proposalController.simulateProposal);
router.post('/check-emails', proposalController.checkInbox);
router.post('/auto-generate', proposalController.autoGenerateProposal);
router.get('/:id', proposalController.getProposalById);
router.put('/:id/status', proposalController.updateProposalStatus);
router.delete('/:id', proposalController.deleteProposal);

module.exports = router;
