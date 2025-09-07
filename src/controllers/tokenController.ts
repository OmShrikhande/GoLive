import { NextFunction, Request, Response } from 'express';
import { generateToken } from '../utils/tokenGenerator';

const identities = new Set<string>();

export function getToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomName, identity, isPublisher } = req.query;
    if (!roomName || !identity) {
      return res.status(400).json({ error: 'roomName and identity are required' });
    }
    if (identities.has(identity as string)) {
      return res.status(409).json({ error: 'Identity must be unique per user' });
    }
    identities.add(identity as string);
    const token = generateToken({
      roomName: roomName as string,
      identity: identity as string,
      isPublisher: isPublisher === 'true',
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}

// Compatibility endpoint for frontend: POST /api/livekit/token
// Body: { userId, roomName, role }
// role: 'publisher' enables publish permissions, otherwise viewer
export function postLivekitToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, roomName, role } = req.body || {};
    if (!roomName || !userId) {
      return res.status(400).json({ error: 'roomName and userId are required' });
    }

    const identity = String(userId);
    if (identities.has(identity)) {
      return res.status(409).json({ error: 'Identity must be unique per user' });
    }
    identities.add(identity);

    const isPublisher = String(role).toLowerCase() === 'publisher';
    const token = generateToken({ roomName: String(roomName), identity, isPublisher });
    return res.json({ token });
  } catch (err) {
    next(err);
  }
}