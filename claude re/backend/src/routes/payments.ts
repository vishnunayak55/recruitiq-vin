import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/db';

const router = Router();

// ₹49 = 4900 paise, ₹99 = 9900 paise (Razorpay uses paise)
const PLANS: Record<string, { amount: number; name: string; display: string }> = {
  pro:     { amount: 4900,  name: 'Pro',     display: '₹49' },
  premium: { amount: 9900,  name: 'Premium', display: '₹99' },
};

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan selected' });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ error: 'Payment gateway not configured. Please contact support.' });
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: PLANS[plan].amount,
      currency: 'INR',
      receipt: `rcpt_${req.user!.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: req.user!.id, plan },
    });

    await supabase.from('payments').insert({
      user_id: req.user!.id,
      order_id: order.id,
      plan,
      amount: PLANS[plan].amount,
      currency: 'INR',
      status: 'created',
    });

    res.json({
      order_id: order.id,
      amount: PLANS[plan].amount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_name: PLANS[plan].name,
      display_price: PLANS[plan].display,
    });
  } catch (e: any) {
    console.error('Payment order error:', e);
    res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature server-side (HMAC-SHA256)
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Confirm payment belongs to this user
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    // Update payment status + upgrade user plan
    await Promise.all([
      supabase.from('payments')
        .update({ payment_id: razorpay_payment_id, status: 'paid' })
        .eq('order_id', razorpay_order_id),
      supabase.from('users')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', req.user!.id),
    ]);

    res.json({ success: true, message: `Successfully upgraded to ${plan} plan!` });
  } catch (e: any) {
    console.error('Payment verify error:', e);
    res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
  }
});

// GET /api/payments/subscription
router.get('/subscription', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [{ data: user }, { data: payments }] = await Promise.all([
      supabase.from('users').select('plan, analyses_count').eq('id', req.user!.id).single(),
      supabase.from('payments').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false }).limit(5),
    ]);
    res.json({ subscription: user, payments: payments || [] });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

export default router;
