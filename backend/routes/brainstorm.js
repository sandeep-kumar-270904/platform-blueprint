const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const brainstormController = require('../controllers/brainstormController');

// Public read routes
router.get('/', brainstormController.getSessions);
router.get('/:id', brainstormController.getSessionById);
router.get('/:id/thoughts', brainstormController.getThoughts);

// Protected routes
router.use(auth);
router.post('/', checkSuspended, brainstormController.createSession);
router.put('/:id', checkSuspended, brainstormController.updateSession);
router.delete('/:id', checkSuspended, brainstormController.deleteSession);

router.post('/:id/join', checkSuspended, brainstormController.joinSession);
router.post('/:id/leave', checkSuspended, brainstormController.leaveSession);
router.delete('/:id/participants/:userId', checkSuspended, brainstormController.leaveSession);

router.post('/:id/thoughts', checkSuspended, brainstormController.addThought);
router.put('/:id/thoughts/:thoughtId', checkSuspended, brainstormController.updateThought);
router.delete('/:id/thoughts/:thoughtId', checkSuspended, brainstormController.deleteThought);
router.post('/:id/thoughts/:thoughtId/react', checkSuspended, brainstormController.reactToThought);

module.exports = router;
