const express = require('express');
const router = express.Router();

const {
    authenticate,
    createPasswordResetRequest,
    getPasswordResetRequest,
    markPasswordResetRequestUsed,
    updateUserPassword
} = require('../services/authService');

const { redirectIfAuthenticated } = require('../middleware/auth');

/* ============================================================
   LOGIN
   ============================================================ */

router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('pages/login', {
        title: 'Sign In',
        active: '',
        secureHeader: false,
        layout: 'auth',
        currentUser: null,
        error: req.query.error ? 'The email or password is incorrect.' : null,
        success: req.query.reset ? 'Your password has been updated. Please sign in.' : null,
        next: req.query.next || '/dashboard'
    });
});

router.post('/login', redirectIfAuthenticated, (req, res) => {
    const { email, password, next } = req.body;

    const user = authenticate(email, password);

    if (!user) {
        return res.redirect('/login?error=1');
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    req.session.save(() => {
        res.redirect(next || '/dashboard');
    });
});


/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

router.get('/forgot-password', redirectIfAuthenticated, (req, res) => {
    res.render('pages/forgot-password', {
        title: 'Forgot Password',
        active: '',
        secureHeader: false,
        layout: 'auth',
        currentUser: null,
        error: null,
        success: null
    });
});

router.post('/forgot-password', redirectIfAuthenticated, (req, res) => {
    const { firstName, email } = req.body;

    if (!firstName || !email) {
        return res.status(400).render('pages/forgot-password', {
            title: 'Forgot Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            error: 'Please enter your first name and school email.',
            success: null
        });
    }

    const resetRequest = createPasswordResetRequest(firstName, email);

    if (resetRequest.matched && resetRequest.token) {
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetRequest.token}`;

        console.log('');
        console.log('============================================================');
        console.log('PASSWORD RESET REQUEST');
        console.log(`User: ${resetRequest.user.fullName}`);
        console.log(`Email: ${resetRequest.user.email}`);
        console.log(`Reset link: ${resetLink}`);
        console.log('This is logged for development only. Add SMTP later.');
        console.log('============================================================');
        console.log('');
    }

    return res.render('pages/forgot-password', {
        title: 'Forgot Password',
        active: '',
        secureHeader: false,
        layout: 'auth',
        currentUser: null,
        error: null,
        success: resetRequest.message
    });
});


/* ============================================================
   RESET PASSWORD
   ============================================================ */

router.get('/reset-password/:token', redirectIfAuthenticated, (req, res) => {
    const resetRequest = getPasswordResetRequest(req.params.token);

    if (!resetRequest) {
        return res.status(400).render('pages/forgot-password', {
            title: 'Forgot Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            error: 'This reset link is invalid or has expired. Please request a new reset email.',
            success: null
        });
    }

    return res.render('pages/reset-password', {
        title: 'Reset Password',
        active: '',
        secureHeader: false,
        layout: 'auth',
        currentUser: null,
        token: req.params.token,
        error: null
    });
});

router.post('/reset-password/:token', redirectIfAuthenticated, (req, res) => {
    const resetRequest = getPasswordResetRequest(req.params.token);

    if (!resetRequest) {
        return res.status(400).render('pages/forgot-password', {
            title: 'Forgot Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            error: 'This reset link is invalid or has expired. Please request a new reset email.',
            success: null
        });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).render('pages/reset-password', {
            title: 'Reset Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            token: req.params.token,
            error: 'Please enter and confirm your new password.'
        });
    }

    if (password.length < 8) {
        return res.status(400).render('pages/reset-password', {
            title: 'Reset Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            token: req.params.token,
            error: 'Your password must be at least 8 characters long.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('pages/reset-password', {
            title: 'Reset Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            token: req.params.token,
            error: 'The passwords do not match.'
        });
    }

    const updated = updateUserPassword(resetRequest.userId, password);

    if (!updated) {
        return res.status(500).render('pages/reset-password', {
            title: 'Reset Password',
            active: '',
            secureHeader: false,
            layout: 'auth',
            currentUser: null,
            token: req.params.token,
            error: 'The password could not be updated. Please try again.'
        });
    }

    markPasswordResetRequestUsed(req.params.token);

    return res.redirect('/login?reset=1');
});


/* ============================================================
   LOGOUT
   ============================================================ */

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('mshs.helpdesk.sid');
        res.redirect('/login');
    });
});

module.exports = router;