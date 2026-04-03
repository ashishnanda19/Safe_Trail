import { db } from '../config/db.js';
import { redis } from '../config/redis.js';
import * as sosService from '../services/sos.service.js';
import {
  updateSettingsSchema,
  addKeywordSchema,
  voiceTriggerSchema,
} from '../validators/voice.validators.js';

const DEFAULT_KEYWORDS = ['help me', 'bachao', 'help', 'emergency', 'save me'];

/**
 * GET /api/voice/settings  [JWT]
 */
export const getSettings = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT vs.id, vs.is_enabled, vs.sensitivity, vs.created_at, vs.updated_at,
              COALESCE(array_agg(
                json_build_object('id', vk.id, 'keyword', vk.keyword, 'language', vk.language)
              ) FILTER (WHERE vk.id IS NOT NULL), '{}') AS keywords
       FROM voice_sos_settings vs
       LEFT JOIN voice_keywords vk ON vk.user_id = vs.user_id
       WHERE vs.user_id = $1
       GROUP BY vs.id`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      // Return defaults for users who haven't configured yet
      return res.status(200).json({
        success: true,
        data: { is_enabled: false, sensitivity: 'medium', keywords: [] },
      });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/voice/settings  [JWT]
 */
export const updateSettings = async (req, res, next) => {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: parsed.error.errors });
    }

    const { is_enabled, sensitivity } = parsed.data;

    // Check if settings row already exists (for first-time enable detection)
    const existing = await db.query(
      `SELECT id FROM voice_sos_settings WHERE user_id = $1`,
      [req.user.id]
    );

    // UPSERT settings
    const settingsResult = await db.query(
      `INSERT INTO voice_sos_settings (user_id, is_enabled, sensitivity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET is_enabled = EXCLUDED.is_enabled,
             sensitivity = EXCLUDED.sensitivity,
             updated_at = NOW()
       RETURNING *`,
      [req.user.id, is_enabled, sensitivity]
    );

    // Insert defaults if enabling for the first time (no prior settings record)
    if (is_enabled && existing.rows.length === 0) {
      const keywordCount = await db.query(
        `SELECT COUNT(*) FROM voice_keywords WHERE user_id = $1`,
        [req.user.id]
      );
      if (parseInt(keywordCount.rows[0].count, 10) === 0) {
        await db.query(
          `INSERT INTO voice_keywords (user_id, keyword)
           SELECT $1, unnest($2::text[])
           ON CONFLICT (user_id, keyword) DO NOTHING`,
          [req.user.id, DEFAULT_KEYWORDS]
        );
      }
    }

    return res.status(200).json({ success: true, data: settingsResult.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/voice/keywords  [JWT]
 */
export const getKeywords = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, keyword, language, created_at
       FROM voice_keywords WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/voice/keywords  [JWT]
 */
export const addKeyword = async (req, res, next) => {
  try {
    const parsed = addKeywordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: parsed.error.errors });
    }

    const { keyword, language } = parsed.data;

    // Enforce max 10 keywords per user
    const countResult = await db.query(
      `SELECT COUNT(*) FROM voice_keywords WHERE user_id = $1`,
      [req.user.id]
    );
    if (parseInt(countResult.rows[0].count, 10) >= 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 keywords allowed per user' });
    }

    try {
      const result = await db.query(
        `INSERT INTO voice_keywords (user_id, keyword, language)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.user.id, keyword, language]
      );
      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ success: false, message: `Keyword "${keyword}" already exists` });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/voice/keywords/:id  [JWT]
 */
export const removeKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure user has at least 2 keywords before allowing delete
    const countResult = await db.query(
      `SELECT COUNT(*) FROM voice_keywords WHERE user_id = $1`,
      [req.user.id]
    );
    if (parseInt(countResult.rows[0].count, 10) <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the last keyword' });
    }

    const result = await db.query(
      `DELETE FROM voice_keywords WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Keyword not found' });
    }

    return res.status(200).json({ success: true, message: 'Keyword removed' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/voice/trigger  [JWT]
 * Critical endpoint — voice match detected on client, fires SOS pipeline
 */
export const triggerFromVoice = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Check Redis cooldown
    const cooldownKey = `voice_sos_cooldown:${userId}`;
    const isCoolingDown = await redis.get(cooldownKey);
    if (isCoolingDown) {
      return res.status(429).json({
        success: false,
        message: 'SOS already triggered, cooldown active',
      });
    }

    // 2. Verify voice SOS is enabled for this user
    const settingsResult = await db.query(
      `SELECT is_enabled FROM voice_sos_settings WHERE user_id = $1`,
      [userId]
    );
    if (!settingsResult.rows[0]?.is_enabled) {
      return res.status(403).json({ success: false, message: 'Voice SOS is not enabled' });
    }

    // 3. Validate body
    const parsed = voiceTriggerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: parsed.error.errors });
    }

    const { latitude, longitude, detectedKeyword, confidence } = parsed.data;

    // 4. Set Redis cooldown (60s TTL) before firing SOS to prevent double-fire
    await redis.set(cooldownKey, '1', 'EX', 60);

    // 5. Log the detection
    await db.query(
      `INSERT INTO voice_trigger_log (user_id, detected_keyword, confidence)
       VALUES ($1, $2, $3)`,
      [userId, detectedKeyword, confidence]
    );

    // 6. Fire the existing SOS pipeline (DB insert + socket broadcast + BullMQ jobs + SMS)
    const result = await sosService.triggerSOS(userId, { latitude, longitude }, req.user.name);

    // 7. Respond
    return res.status(201).json({
      success: true,
      message: 'SOS triggered via voice',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
