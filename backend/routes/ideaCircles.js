const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const ideaCircleController = require('../controllers/ideaCircleController');

// Optional auth for public GETs
const optionalAuth = (req, res, next) => {
  // Simple check, in production we might use a non-blocking auth verifier
  const token = req.header('Authorization');
  if (token) return auth(req, res, next);
  next();
};

router.get('/', optionalAuth, ideaCircleController.getCircles);
router.get('/:id', optionalAuth, ideaCircleController.getCircleById);
router.get('/:id/posts', optionalAuth, ideaCircleController.getPosts);

// Protected routes
router.use(auth);
router.post('/', checkSuspended, ideaCircleController.createCircle);
router.put('/:id', checkSuspended, ideaCircleController.updateCircle);
router.delete('/:id', checkSuspended, ideaCircleController.deleteCircle);

router.post('/:id/join', checkSuspended, ideaCircleController.joinCircle);
router.post('/:id/leave', checkSuspended, ideaCircleController.leaveCircle);
router.delete('/:id/members/:userId', checkSuspended, ideaCircleController.leaveCircle);

router.post('/:id/posts', checkSuspended, ideaCircleController.createPost);
router.put('/:id/posts/:postId', checkSuspended, ideaCircleController.updatePost);
router.delete('/:id/posts/:postId', checkSuspended, ideaCircleController.deletePost);
router.patch('/:id/posts/:postId/pin', checkSuspended, ideaCircleController.pinPost);

module.exports = router;
