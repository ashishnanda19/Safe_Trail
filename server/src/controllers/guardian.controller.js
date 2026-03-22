import * as guardianQuery from '../db/queries/guardian_circles.queries.js';
import * as usersQuery from '../db/queries/users.queries.js';
import { sendSMS } from '../services/notification.service.js';
import { emitToRoom } from '../sockets/index.js';

/**
 * GET /api/guardians  — list my accepted guardians
 */
export const listGuardians = async (req, res, next) => {
  try {
    const guardians = await guardianQuery.listMyGuardians(req.user.id);
    return res.status(200).json({ success: true, data: { guardians } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/guardians  — add guardian by phone number
 */
export const addGuardian = async (req, res, next) => {
  try {
    const { phone } = req.validatedBody;

    // Look up the guardian by phone
    const guardian = await usersQuery.findByPhone(phone);
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that phone number. They must register first.',
      });
    }

    if (guardian.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a guardian.',
      });
    }

    const circle = await guardianQuery.addGuardian(req.user.id, guardian.id);

    // Send SMS invite
    await sendSMS(
      phone,
      `SafeTraiL: ${req.user.name} has invited you to be their guardian. ` +
      `Download the app and accept the request to protect someone you care about.`
    ).catch(err => console.error('SMS invite failed:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Guardian invitation sent.',
      data: { circleId: circle.id, guardianName: guardian.name, status: 'pending' },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'This user is already in your guardian circle.',
      });
    }
    next(err);
  }
};

/**
 * PATCH /api/guardians/:circleId/accept  — accept guardian invite
 */
export const acceptInvite = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const circle = await guardianQuery.findByCircleId(circleId);

    if (!circle) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    // Only the guardian (invitee) can accept
    if (circle.guardian_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this invitation.',
      });
    }

    if (circle.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation is already ${circle.status}.`,
      });
    }

    const updated = await guardianQuery.updateStatus(circleId, 'accepted');

    // Tell the guardian's active socket to instantly start listening to the user's SOS room
    emitToRoom(`user:${req.user.id}`, 'guardian:added', { userId: circle.user_id });

    return res.status(200).json({
      success: true,
      message: 'You are now a guardian.',
      data: { circle: updated },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/guardians/:guardianId  — remove from circle
 */
export const removeGuardian = async (req, res, next) => {
  try {
    const { guardianId } = req.params;
    const removed = await guardianQuery.remove(req.user.id, guardianId);

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Guardian relationship not found.' });
    }

    return res.status(200).json({ success: true, message: 'Guardian removed from your circle.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/guardians/invites  — see pending invites (as guardian)
 */
export const listInvites = async (req, res, next) => {
  try {
    const invites = await guardianQuery.listPendingInvites(req.user.id);
    return res.status(200).json({ success: true, data: { invites } });
  } catch (err) {
    next(err);
  }
};
