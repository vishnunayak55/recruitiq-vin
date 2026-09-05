import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; plan: string };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    req.user = { id: decoded.id, email: decoded.email, plan: decoded.plan };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const checkPlan = (requiredPlan: 'pro' | 'premium') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    const userPlan = (req.user?.plan || 'free') as keyof typeof planHierarchy;
    
    if (planHierarchy[userPlan] < planHierarchy[requiredPlan]) {
      return res.status(403).json({ 
        error: `This feature requires ${requiredPlan} plan or higher`,
        requiredPlan 
      });
    }
    next();
  };
};
