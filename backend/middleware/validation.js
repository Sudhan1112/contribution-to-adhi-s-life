const validator = require('validator');

const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    next();
};

const validateRegistrationInput = (req, res, next) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validator.isLength(password, { min: 8 })) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!validator.matches(password, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)) {
        return res.status(400).json({ 
            error: 'Password must contain at least one letter, one number, and be at least 8 characters long'
        });
    }

    next();
};

const validateUpdateInput = (req, res, next) => {
    const { email, password, name } = req.body;

    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password) {
        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        if (!validator.matches(password, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)) {
            return res.status(400).json({ 
                error: 'Password must contain at least one letter, one number, and be at least 8 characters long'
            });
        }
    }

    next();
};

module.exports = {
    validateLoginInput,
    validateRegistrationInput,
    validateUpdateInput
};