import { z } from 'zod';

export const addKeywordSchema = z.object({
  keyword:  z.string().min(2).max(50).transform(v => v.toLowerCase().trim()),
  language: z.string().length(5).default('en-IN'),
});

export const updateSettingsSchema = z.object({
  is_enabled:  z.boolean(),
  sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const voiceTriggerSchema = z.object({
  latitude:        z.number().min(-90).max(90),
  longitude:       z.number().min(-180).max(180),
  detectedKeyword: z.string().min(1).max(100),
  confidence:      z.number().min(0).max(1),
});
