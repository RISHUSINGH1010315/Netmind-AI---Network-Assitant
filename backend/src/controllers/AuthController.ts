import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_netmind_jwt_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_netmind_jwt_refresh_key_999';

// In-memory refresh token registry (For production, store in Redis/DB)
let refreshTokens: string[] = [];

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({
      name,
      email,
      password,
      role: role || 'Viewer' // Default role
    });

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    refreshTokens.push(refreshToken);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const tokenRefresh = (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });
  if (!refreshTokens.includes(token)) return res.status(403).json({ error: 'Invalid refresh token' });

  jwt.verify(token, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Expired or invalid refresh token' });

    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ accessToken });
  });
};

export const logout = (req: Request, res: Response) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  return res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
