import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_netmind_jwt_key_123';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'Super Admin' | 'Network Engineer' | 'NOC Engineer' | 'Security Analyst' | 'Viewer';
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      return next();
    });
  } else {
    return res.status(401).json({ error: 'Authorization token required' });
  }
};

// Role authorization builder
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (req.user.role === 'Super Admin') {
      return next(); // Super Admin bypasses all checks
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]`
    });
  };
};
