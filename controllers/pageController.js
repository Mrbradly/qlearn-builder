const {
  devices,
  loans,
  issues,
  damageReports,
  parentApplications,
  studentsNeedingLaptop
} = require('../data/mockData');

function pageDefaults(active, title, extra = {}) {
  return {
    title,
    active,
    secureHeader: false,
    layout: 'app',
    ...extra
  };
}

exports.dashboard = (req, res) => res.render('pages/dashboard', pageDefaults('dashboard', 'Dashboard'));
exports.devices = (req, res) => res.render('pages/devices', pageDefaults('devices', 'Device Inventory', { devices }));
exports.deviceProfile = (req, res) => res.render('pages/device-profile', pageDefaults('devices', 'Device Profile'));
exports.loans = (req, res) => res.render('pages/loans', pageDefaults('loans', 'Loan Manager', { loans, studentsNeedingLaptop }));
exports.parentApplication = (req, res) => res.render('pages/parent-application', pageDefaults('', 'Short-Term Laptop Loan Application', { layout: 'public', secureHeader: true }));
exports.issues = (req, res) => res.render('pages/issues', pageDefaults('issues', 'IT Issues', { issues }));
exports.damage = (req, res) => res.render('pages/damage', pageDefaults('damage', 'Lab Damage Reports', { damageReports }));

exports.parentApplications = (req, res) => {
  res.render('pages/parent-applications', pageDefaults('applications', 'Parent Applications', {
    parentApplications,
    studentsNeedingLaptop,
    query: req.query
  }));
};

exports.approveParentApplication = (req, res) => {
  const application = parentApplications.find((item) => item.id === req.params.id);
  if (application && application.status !== 'approved') {
    application.status = 'approved';
    studentsNeedingLaptop.push({
      studentName: application.studentName,
      studentId: application.studentId,
      yearLevel: application.yearLevel,
      sourceApplication: application.id,
      approvedBy: req.currentUser.fullName,
      status: 'Ready to assign',
      requestedLoanType: application.requestedLoanType
    });
  }
  res.redirect('/parent-applications?approved=1');
};

exports.placeholder = (req, res) => {
  const map = {
    '/warranty-alerts': ['warranty', 'Warranty Alerts'],
    '/students': ['students', 'Students'],
    '/reports': ['reports', 'Reports']
  };
  const [active, title] = map[req.path] || ['', 'Coming Soon'];
  res.render('pages/placeholder', pageDefaults(active, title));
};
