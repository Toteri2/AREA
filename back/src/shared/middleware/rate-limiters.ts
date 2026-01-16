import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Trop de tentatives, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Trop de requêtes, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
});


export const reactionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Trop de requêtes, réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
