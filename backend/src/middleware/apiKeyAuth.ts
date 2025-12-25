import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiKeyEnabled) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

  next();
}
