import * as usersQuery from '../db/queries/users.queries.js';

/**
 * GET /api/users/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await usersQuery.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/me
 */
export const updateMe = async (req, res, next) => {
  try {
    const { name, phone, fcm_token } = req.validatedBody;
    const updated = await usersQuery.updateUser(req.user.id, { name, phone, fcm_token });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: { user: updated }, message: 'Profile updated.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Phone number already in use.' });
    }
    next(err);
  }
};

/**
 * PATCH /api/users/me/location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.validatedBody;
    await usersQuery.updateLocation(req.user.id, latitude, longitude);
    return res.status(200).json({
      success: true,
      message: 'Location updated.',
      data: { latitude, longitude, updatedAt: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
};
