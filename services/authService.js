const crypto = require('crypto');

const SCRYPT_OPTIONS = {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024
};

const KEY_LENGTH = 64;

/*
  Local demo users.

  Passwords are stored as scrypt hashes, not plain text.

  Important:
  Because this is currently in-memory, password resets only last while
  the Node server is running. When the server restarts, these hardcoded
  hashes are loaded again.

  Later, this should move to Supabase Auth or a real users table.
*/
const users = [
    {
        id: 'user-bradly-owner',
        fullName: 'Bradly Saunders',
        email: 'bxsau0@eq.edu.au',
        initials: 'BS',
        role: 'account_owner',
        roleLabel: 'Account Owner',
        canApproveParentApplications: true,
        canManageParentApplications: true,
        canManageEverything: true,
        passwordSalt: 'i8fW2ktLctRJdsXjXj7w7g==',
        passwordHash: 'Vn8023XCWG2qXkmO9EXJsOOOVy40XznmCO3327K3+02DlTcobnQe+vPNzgCjjFzmCNCOZnTdDe200IcQbilvDA=='
    },
    {
        id: 'user-frank-staff',
        fullName: 'Frank Axthammer',
        email: 'cbrac10@eq.edu.au',
        initials: 'FA',
        role: 'it_staff',
        roleLabel: 'IT Staff',
        canApproveParentApplications: false,
        canManageParentApplications: false,
        canManageEverything: false,
        passwordSalt: 'eciCdLNICSgLY5YS8Y/dAA==',
        passwordHash: 'JmSZfNl85oSqK8K96Md8O/bCNvLJpaF3IP6pZ6J7LnqtFTbOOhedh8l3MtysuEwLWI4Fc3IarYvupXbr67g6+A=='
    },
    {
        id: 'user-christian-staff',
        fullName: 'Christian Bracco',
        email: 'faxth1@eq.edu.au',
        initials: 'CB',
        role: 'it_staff',
        roleLabel: 'IT Staff',
        canApproveParentApplications: false,
        canManageParentApplications: false,
        canManageEverything: false,
        passwordSalt: 'LBt/ZyzeHw4yBxCH5HaYVw==',
        passwordHash: 'p0grsbMGcUxeBE8E2d+TXIWK08ERMiqHe1yAg+9fmjR99CW8tSh23IVXApyb3o9BZ9WiUFlFOTedbWrh51LwhQ=='
    }
];

const resetRequests = new Map();

function normalise(value) {
    return String(value || '').trim().toLowerCase();
}

function safeUser(user) {
    if (!user) return null;

    const { passwordSalt, passwordHash, ...safe } = user;

    return safe;
}

function findUserByEmail(email) {
    const cleanEmail = normalise(email);

    return users.find((user) => normalise(user.email) === cleanEmail) || null;
}

function verifyPassword(password, user) {
    if (!user || !password) return false;

    const salt = Buffer.from(user.passwordSalt, 'base64');
    const expected = Buffer.from(user.passwordHash, 'base64');

    const actual = crypto.scryptSync(
        String(password),
        salt,
        KEY_LENGTH,
        SCRYPT_OPTIONS
    );

    return (
        expected.length === actual.length &&
        crypto.timingSafeEqual(expected, actual)
    );
}

function authenticate(email, password) {
    const user = findUserByEmail(email);

    if (!user) return null;
    if (!verifyPassword(password, user)) return null;

    return safeUser(user);
}

function getUserById(id) {
    const user = users.find((candidate) => candidate.id === id);

    return safeUser(user);
}

function findUserByFirstNameAndEmail(firstName, email) {
    const cleanFirstName = normalise(firstName);
    const cleanEmail = normalise(email);

    return users.find((user) => {
        const userFirstName = normalise(user.fullName.split(' ')[0]);

        return (
            userFirstName === cleanFirstName &&
            normalise(user.email) === cleanEmail
        );
    }) || null;
}

function createPasswordResetRequest(firstName, email) {
    const user = findUserByFirstNameAndEmail(firstName, email);

    /*
      Do not reveal whether the account exists.
      This prevents people from using the forgot-password page
      to check which staff accounts exist.
    */
    if (!user) {
        return {
            ok: true,
            matched: false,
            message: 'If the details match a staff account, a reset password email has been sent.'
        };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 30;

    resetRequests.set(token, {
        token,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        expiresAt,
        used: false
    });

    return {
        ok: true,
        matched: true,
        token,
        user: safeUser(user),
        expiresAt,
        message: 'If the details match a staff account, a reset password email has been sent.'
    };
}

function getPasswordResetRequest(token) {
    const cleanToken = String(token || '').trim();
    const request = resetRequests.get(cleanToken);

    if (!request || request.used) return null;

    if (Date.now() > request.expiresAt) {
        resetRequests.delete(cleanToken);
        return null;
    }

    return request;
}

function markPasswordResetRequestUsed(token) {
    const cleanToken = String(token || '').trim();
    const request = resetRequests.get(cleanToken);

    if (!request) return false;

    request.used = true;
    resetRequests.set(cleanToken, request);

    return true;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16);

    const hash = crypto.scryptSync(
        String(password),
        salt,
        KEY_LENGTH,
        SCRYPT_OPTIONS
    );

    return {
        passwordSalt: salt.toString('base64'),
        passwordHash: hash.toString('base64')
    };
}

function updateUserPassword(userId, newPassword) {
    const user = users.find((candidate) => candidate.id === userId);

    if (!user) return false;

    const passwordParts = hashPassword(newPassword);

    user.passwordSalt = passwordParts.passwordSalt;
    user.passwordHash = passwordParts.passwordHash;

    return true;
}

module.exports = {
    authenticate,
    getUserById,
    users: users.map(safeUser),
    createPasswordResetRequest,
    getPasswordResetRequest,
    markPasswordResetRequestUsed,
    updateUserPassword
};