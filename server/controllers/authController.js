const { User, RefreshToken, ActivityLog, School } = require('../models');
const { sendTokens, generateAccessToken } = require('../utils/generateTokens');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: log activity ──────────────────────────────────────────────────────
const logActivity = async ({ user, action, description, req }) => {
  try {
    await ActivityLog.create({
      user:      user._id,
      userRole:  user.role,
      action,
      description,
      ipAddress: req.ip,
      device:    req.headers['user-agent']?.split(' ')[0] || 'Unknown',
      browser:   req.headers['user-agent'] || 'Unknown',
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

// ── @POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login + login history
    user.lastLogin = new Date();
    user.loginHistory.unshift({
      ip:      req.ip,
      device:  req.headers['user-agent']?.split(' ')[0] || 'Unknown',
      browser: req.headers['user-agent'] || 'Unknown',
      loginAt: new Date(),
    });
    if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(0, 10);
    await user.save();

    await logActivity({
      user,
      action:      user.role === 'school_user' ? 'School Login' : 'Admin Login',
      description: `${user.name} logged in`,
      req,
    });

    await sendTokens(user, 200, res, req);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── @POST /api/auth/refresh ───────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const storedToken = await RefreshToken.findOne({ token });

    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    if (storedToken.isRevoked) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked. Please log in again.',
      });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please log in again.',
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({ success: true, accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
};

// ── @POST /api/auth/logout ────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await RefreshToken.findOneAndUpdate(
        { token },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    if (req.user) {
      await logActivity({
        user:        req.user,
        action:      'Logout',
        description: `${req.user.name} logged out`,
        req,
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

// ── @GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens — force re-login on other devices
    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    await logActivity({
      user,
      action:      'Password Changed',
      description: `${user.name} changed their password`,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @POST /api/auth/google-login ──────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.',
      });
    }

    // Verify token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token.',
      });
    }

    const { email, name, picture, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Validate that the email does not belong to an Admin or Super Admin account
      if (user.role !== 'school_user') {
        return res.status(403).json({
          success: false,
          message: 'Google login is only allowed for School User accounts.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Link googleId if not already linked
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar) {
        user.avatar = picture;
        updated = true;
      }
      if (!user.photo) {
        user.photo = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create new School User
      user = await User.create({
        name,
        email: cleanEmail,
        role: 'school_user',
        provider: 'google',
        googleId,
        avatar: picture,
        photo: picture,
        isActive: true,
        isVerified: true,
      });

      // Try to link this user to an existing school with the same email if one exists
      const school = await School.findOne({ email: cleanEmail });
      if (school) {
        if (!school.schoolUser) {
          school.schoolUser = user._id;
          await school.save();
          console.log(`Auto-linked newly created Google school user to school: ${school.schoolName}`);
        }
      }
    }

    // Update last login + login history
    user.lastLogin = new Date();
    user.loginHistory.unshift({
      ip:      req.ip,
      device:  req.headers['user-agent']?.split(' ')[0] || 'Unknown',
      browser: req.headers['user-agent'] || 'Unknown',
      loginAt: new Date(),
    });
    if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(0, 10);
    await user.save();

    await logActivity({
      user,
      action:      'Google Login',
      description: `${user.name} logged in via Google`,
      req,
    });

    await sendTokens(user, 200, res, req);
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ success: false, message: 'Server error during Google login.' });
  }
};

module.exports = { login, refreshToken, logout, getMe, changePassword, googleLogin };
