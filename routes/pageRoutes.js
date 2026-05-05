const express = require('express');
const router = express.Router();
const page = require('../controllers/pageController');
const { requireAuth, requireAccountOwner } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect(req.currentUser ? '/dashboard' : '/login'));

// Public parent form. Parents do not log in.
router.get('/apply/short-term-laptop-loan', page.parentApplication);

// Staff/app routes.
router.get('/dashboard', requireAuth, page.dashboard);
router.get('/devices', requireAuth, page.devices);
router.get('/devices/:assetNumber', requireAuth, page.deviceProfile);
router.get('/loans', requireAuth, page.loans);
router.get('/issues', requireAuth, page.issues);
router.get('/damage-reports', requireAuth, page.damage);
router.get('/warranty-alerts', requireAuth, page.placeholder);
router.get('/students', requireAuth, page.placeholder);
router.get('/reports', requireAuth, page.placeholder);

// Account owner only.
router.get('/parent-applications', requireAuth, requireAccountOwner, page.parentApplications);
router.post('/parent-applications/:id/approve', requireAuth, requireAccountOwner, page.approveParentApplication);

module.exports = router;
