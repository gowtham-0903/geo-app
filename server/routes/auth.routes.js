const router = require('express').Router();
const auth   = require('../controllers/auth.controller');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.post('/login',  auth.login);
router.post('/logout', verifyToken, auth.logout);
router.get('/me',      verifyToken, auth.me);

// Admin only — manage supervisors
router.get('/users',         verifyToken, adminOnly, auth.listUsers);
router.post('/users',        verifyToken, adminOnly, auth.createUser);
router.patch('/users/:id',   verifyToken, adminOnly, auth.toggleUser);

module.exports = router;