const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Requests
router.post('/request', feedbackController.requestFeedback);
router.get('/requests', feedbackController.getFeedbackRequests);
router.get('/requests/open', feedbackController.getOpenFeedbackRequests);
router.post('/requests/:id/pickup', feedbackController.pickupOpenRequest);

// Comments
router.post('/comments', feedbackController.addComment);
router.get('/requests/:feedbackRequestId/comments', feedbackController.getComments);
router.put('/comments/:id/resolve', feedbackController.resolveComment);

module.exports = router;
