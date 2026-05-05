const express = require('express');
const router = express.Router();
const { devices, loans, issues, damageReports, parentApplications, studentsNeedingLaptop } = require('../data/mockData');
const { requireAuth, requireAccountOwner } = require('../middleware/auth');

router.get('/health', (req, res) => res.json({ ok: true, app: 'MSHS IT Help Desk' }));

// Public parent submit endpoint. In production, insert into Supabase here.
router.post('/loan-applications', (req, res) => {
  res.status(201).json({
    ok: true,
    message: 'Loan application received',
    reference: `APP-${Date.now()}`,
    data: req.body
  });
});

// Staff API routes require login.
router.get('/devices', requireAuth, (req, res) => res.json({ devices }));
router.get('/loans', requireAuth, (req, res) => res.json({ loans, studentsNeedingLaptop }));
router.get('/issues', requireAuth, (req, res) => res.json({ issues }));
router.get('/damage-reports', requireAuth, (req, res) => res.json({ damageReports }));

// Account owner only.
router.get('/parent-applications', requireAuth, requireAccountOwner, (req, res) => res.json({ parentApplications }));

module.exports = router;
