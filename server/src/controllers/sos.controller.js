import * as sosService from '../services/sos.service.js';

/**
 * POST /api/sos/trigger  [JWT required]
 */
export const trigger = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.validatedBody;
    const result = await sosService.triggerSOS(
      req.user.id,
      { latitude, longitude },
      req.user.name
    );

    return res.status(201).json({
      success: true,
      message: 'SOS triggered. Guardians are being notified.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sos/:eventId/location  [JWT required]
 */
export const addLocation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { latitude, longitude, accuracy } = req.validatedBody;
    const ping = await sosService.addLocationPing(eventId, { latitude, longitude, accuracy });

    return res.status(201).json({
      success: true,
      data: { ping },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sos/:eventId/location  [JWT required]
 */
export const getLatestLocation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const ping = await sosService.getLatestPing(eventId);

    if (!ping) {
      return res.status(404).json({ success: false, message: 'No location pings found for this SOS event.' });
    }

    return res.status(200).json({ success: true, data: { ping } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/sos/:eventId/resolve  [JWT required]
 */
export const resolve = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;
    const event = await sosService.resolveSOS(eventId, req.user.id, notes);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'SOS event not found, already resolved, or you are not the owner.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SOS event resolved.',
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sos/history  [JWT required]
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { events, pagination } = await sosService.getSOSHistory(req.user.id, page, limit);

    return res.status(200).json({
      success: true,
      data: events,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sos/:eventId  [JWT required]
 */
export const getEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await sosService.getSOSEvent(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'SOS event not found.' });
    }

    return res.status(200).json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};
