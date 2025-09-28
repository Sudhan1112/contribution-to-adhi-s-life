const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('dotenv').config();

const router = express.Router();
const { loginLimiter } = require('../middleware/rateLimit');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    // Input validation
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validator.isEmail(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await user.correctPassword(password);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.set('X-Hidden-Hint', 'check_the_response_headers_for_clues');
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Complete validation
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

    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = await User.create({
      email,
      password, // Will be hashed by the model middleware
      name,
      isActive: true // All users are automatically active
    });

    // Activation is automatic for testing
    console.log(`Activation link for ${email}: http://localhost:3001/api/auth/activate/${newUser._id}`);

    res.status(201).json({
      message: 'User created successfully. Please check your email for activation instructions.',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in GET /auth/profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (!validator.isLength(newPassword, { min: 8 })) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    if (!validator.matches(newPassword, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)) {
      return res.status(400).json({ 
        error: 'New password must contain at least one letter, one number, and be at least 8 characters long'
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await user.correctPassword(currentPassword);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in POST /auth/change-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate account
router.get('/activate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Invalid activation link' });
    }

    if (user.isActive) {
      return res.status(400).json({ error: 'Account is already activated' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Error in GET /auth/activate/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = await User.findOne({ email });
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

      // Hash the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save to user document
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = resetTokenExpires;
      await user.save();

      // In a real app, send email with reset link
      console.log(`Password reset link for ${email}: http://localhost:3001/api/auth/reset-password/${resetToken}`);
    }

    // Always return the same message whether user exists or not (security best practice)
    res.json({ message: 'If an account exists with this email, a password reset link will be sent' });
  } catch (error) {
    console.error('Error in POST /auth/forgot-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (!validator.isLength(newPassword, { min: 8 })) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    if (!validator.matches(newPassword, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)) {
      return res.status(400).json({ 
        error: 'New password must contain at least one letter, one number, and be at least 8 characters long'
      });
    }

    // Hash received token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in POST /auth/reset-password/:token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DEBUG route - Remove in production
router.get('/check-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('+password');
    res.json({
      exists: !!user,
      isActive: user ? user.isActive : false,
      hasPassword: user ? !!user.password : false,
      userDetails: user ? {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate all users route - Remove in production
router.get('/activate-all-users', async (req, res) => {
  try {
    await User.updateMany({}, { isActive: true });
    res.json({ message: 'All users have been activated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
