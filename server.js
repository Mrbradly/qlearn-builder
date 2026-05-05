require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

const { attachCurrentUser } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(morgan('dev'));

app.use(
    express.json({
        limit: '10mb'
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '10mb'
    })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        name: 'mshs.helpdesk.sid',
        secret:
            process.env.SESSION_SECRET ||
            'replace-this-with-a-long-random-secret-before-deployment',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

app.use(attachCurrentUser);

app.use(authRoutes);
app.use('/', pageRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => {
    const layout = req.currentUser ? 'app' : 'auth';

    res.status(404).render('pages/not-found', {
        title: 'Page Not Found',
        active: '',
        secureHeader: false,
        layout,
        currentUser: req.currentUser || null
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    const layout = req.currentUser ? 'app' : 'auth';

    res.status(500).render('pages/error', {
        title: 'Server Error',
        active: '',
        error: process.env.NODE_ENV === 'development' ? err : null,
        secureHeader: false,
        layout,
        currentUser: req.currentUser || null
    });
});

app.listen(PORT, () => {
    console.log(`MSHS IT Help Desk running at http://localhost:${PORT}`);
});