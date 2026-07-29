const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const ideaController = require('../controllers/ideaController');

// Public read routes
router.get('/', ideaController.getIdeas);
router.get('/:id', ideaController.getIdeaById);
router.get('/:id/comments', ideaController.getComments);

// Protected write routes
router.use(auth);
router.post('/', checkSuspended, ideaController.createIdea);
router.put('/:id', checkSuspended, ideaController.updateIdea);
router.delete('/:id', checkSuspended, ideaController.deleteIdea);

// Upvotes and Saves
router.post('/:id/upvote', checkSuspended, ideaController.toggleUpvote);
router.post('/:id/save', checkSuspended, ideaController.toggleSave);

// Comments
router.post('/:id/comments', checkSuspended, ideaController.addComment);
router.put('/:id/comments/:commentId', checkSuspended, ideaController.updateComment);
router.delete('/:id/comments/:commentId', checkSuspended, ideaController.deleteComment);

module.exports = router;
