import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // 5
  message: 'Trop de tentatives, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // 30
  message: 'Trop de requêtes, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const reactionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // 20
  message: 'Trop de requêtes, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 50
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
