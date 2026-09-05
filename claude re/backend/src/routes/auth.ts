import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const signToken = (user: { id: string; email: string; plan: string }) =>
  jwt.sign({ id: user.id, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' });

const userPayload = (u: any) => ({
  id: u.id, email: u.email, name: u.name,
  plan: u.plan, analyses_count: u.analyses_count, avatar: null,
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
    if (existing) return res.status(409).json({ error: 'Account already exists with this email' });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users')
      .insert({ email: email.toLowerCase().trim(), name: name.trim(), password_hash, plan: 'free', analyses_count: 0 })
      .select('id, email, name, plan, analyses_count').single();

    if (error) throw error;
    res.status(201).json({ token: signToken(user), user: userPayload(user) });
  } catch (e: any) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: user } = await supabase.from('users')
      .select('id, email, name, plan, analyses_count').eq('id', req.user!.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
