import { db } from '../config/db.js';

/**
 * Factory middleware for evidence access control.
 *
 * role = 'owner'  → must be the SOS event's owner
 * role = 'viewer' → owner OR accepted guardian OR admin
 * role = 'admin'  → req.user.role === 'admin'
 *
 * Attaches req.sosEvent on success.
 */
export const requireEvidenceAccess = (role) => async (req, res, next) => {
  try {
    const { sosEventId } = req.params;

    // Fetch the SOS event
    const eventResult = await db.query(
      `SELECT id, user_id FROM sos_events WHERE id = $1`,
      [sosEventId]
    );

    if (!eventResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'SOS event not found' });
    }

    const sosEvent = eventResult.rows[0];
    req.sosEvent = sosEvent;

    const currentUserId = req.user.id;
    const isOwner = sosEvent.user_id === currentUserId;

    if (role === 'owner') {
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: not the SOS owner' });
      }
      return next();
    }

    if (role === 'admin') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      return next();
    }

    if (role === 'viewer') {
      if (isOwner) return next();

      if (req.user.role === 'admin') return next();

      // Check if current user is an accepted guardian of the SOS owner
      const guardianResult = await db.query(
        `SELECT 1 FROM guardian_circles
         WHERE user_id = $1 AND guardian_id = $2 AND status = 'accepted'`,
        [sosEvent.user_id, currentUserId]
      );

      if (guardianResult.rows.length > 0) return next();

      return res.status(403).json({
        success: false,
        message: 'Access denied: must be the SOS owner, an accepted guardian, or an admin',
      });
    }

    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (err) {
    next(err);
  }
};
