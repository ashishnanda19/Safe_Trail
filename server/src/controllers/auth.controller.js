import bcrypt from 'bcrypt';
import * as usersQuery from '../db/queries/users.queries.js';
import * as authService from '../services/auth.service.js';
import * as refreshTokensQuery from '../db/queries/refresh_tokens.queries.js';

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.validatedBody;

    // Check for duplicate email/phone
    const existingEmail = await usersQuery.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await usersQuery.createUser({ name, email, phone, passwordHash });
    const { accessToken, refreshToken } = await authService.issueTokens(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    // Handle PostgreSQL unique constraint (phone)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone number already exists.',
      });
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await usersQuery.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const { accessToken, refreshToken } = await authService.issueTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    // Verify the JWT signature first
    let decoded;
    try {
      decoded = authService.verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    // Get fresh user data
    const user = await usersQuery.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
      });
    }

    // Rotate: revoke old, issue new pair
    const tokens = await authService.rotateRefreshToken(refreshToken, user);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: tokens,
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout  [JWT required]
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};
