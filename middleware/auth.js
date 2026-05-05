const { getUserById } = require('../services/authService');

function attachCurrentUser(req, res, next) {
  const user = req.session?.userId ? getUserById(req.session.userId) : null;
  req.currentUser = user;
  res.locals.currentUser = user;
  res.locals.isAuthenticated = Boolean(user);
  next();
}

function requireAuth(req, res, next) {
  if (req.currentUser) return next();
  return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

function redirectIfAuthenticated(req, res, next) {
  if (req.currentUser) return res.redirect('/dashboard');
  return next();
}

function requireAccountOwner(req, res, next) {
  if (req.currentUser?.role === 'account_owner') return next();
  return res.status(403).render('pages/unauthorised', {
    title: 'Access Restricted',
    active: '',
    secureHeader: false,
    layout: 'app'
  });
}

module.exports = {
  attachCurrentUser,
  requireAuth,
  redirectIfAuthenticated,
  requireAccountOwner
};
