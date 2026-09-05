import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Loader2, Shield, Star, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

declare global { interface Window { Razorpay: any } }

const loadRazorpay = () => new Promise<boolean>(resolve => {
  if (window.Razorpay) { resolve(true); return; }
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

const LEVELS: Record<string, number> = { free: 0, pro: 1, premium: 2 };

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect to get started',
    icon: null,
    highlight: false,
    tag: null,
    features: [
      { text: '2 resume analyses', included: true },
      { text: 'Full ATS score breakdown', included: true },
      { text: 'AI strengths & weaknesses', included: true },
      { text: 'Resume DNA Score™', included: true },
      { text: 'Download report (.txt)', included: true },
      { text: 'Job description matching', included: true },
      { text: 'Interview prep questions', included: false },
      { text: 'Career roadmap', included: false },
      { text: 'Unlimited analyses', included: false },
    ],
    cta: 'Get Started Free',
    ctaStyle: 'bg-white/8 hover:bg-white/12 text-white border border-white/10',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹49',
    period: 'one-time',
    desc: 'Best for active job seekers',
    icon: <Zap size={14} className="text-indigo-400" />,
    highlight: true,
    tag: 'Most Popular',
    features: [
      { text: 'Unlimited resume analyses', included: true },
      { text: 'Full ATS score breakdown', included: true },
      { text: 'AI strengths & weaknesses', included: true },
      { text: 'Resume DNA Score™', included: true },
      { text: 'Download report (.txt)', included: true },
      { text: 'Job description matching', included: true },
      { text: '4 AI interview questions', included: true },
      { text: 'Career roadmap generator', included: true },
      { text: 'Priority AI processing', included: true },
    ],
    cta: 'Upgrade to Pro — ₹49',
    ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '₹99',
    period: 'one-time',
    desc: 'Maximum career advantage',
    icon: <Crown size={14} className="text-yellow-400" />,
    highlight: false,
    tag: 'Best Value',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: '8 AI interview questions', included: true },
      { text: 'Advanced career insights', included: true },
      { text: 'Resume rewrite suggestions', included: true },
      { text: 'Multi-job comparison', included: true },
      { text: 'Salary negotiation tips', included: true },
      { text: 'Early access to features', included: true },
      { text: 'Priority support', included: true },
      { text: 'Lifetime updates', included: true },
    ],
    cta: 'Upgrade to Premium — ₹99',
    ctaStyle: 'bg-white/8 hover:bg-white/12 text-white border border-yellow-500/30',
  },
];

const Pricing = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    if (!user) { navigate('/signup'); return; }
    if (user.plan === planKey) { toast.success(`You're already on ${planKey}!`); return; }
    if (planKey === 'free') return;
    if (LEVELS[planKey] <= LEVELS[user.plan]) { toast.error('Cannot downgrade your plan'); return; }

    setProcessing(planKey);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Check your internet.');
        setProcessing(null);
        return;
      }

      const { data: order } = await api.post('/payments/create-order', { plan: planKey });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'RecruitIQ',
        description: `${order.plan_name} Plan — One Time Payment`,
        order_id: order.order_id,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
            });
            await refreshUser();
            toast.success(`🎉 Welcome to ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}!`);
            navigate('/dashboard');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Payment verification failed. Contact support.');
          }
          setProcessing(null);
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setProcessing(null) },
      });

      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setProcessing(null);
      });

      rzp.open();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not initiate payment. Please try again.');
      setProcessing(null);
    }
  };

  const userLevel = LEVELS[user?.plan || 'free'];

  return (
    <div className="min-h-screen bg-[#080810] pt-20 pb-16 px-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full text-xs font-semibold text-indigo-300" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Star size={11} className="text-indigo-400" />
            One-time payment — No subscriptions ever
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            Affordable for Every Student
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Less than a cup of chai. Pay once, use forever. No hidden fees.
          </p>

          {/* Comparison badge */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-center">
              <div className="text-zinc-500 text-xs line-through">Competitors</div>
              <div className="text-red-400 font-bold text-sm">₹1,500+/mo</div>
            </div>
            <div className="text-zinc-600 text-lg">vs</div>
            <div className="text-center">
              <div className="text-zinc-400 text-xs">RecruitIQ Pro</div>
              <div className="text-emerald-400 font-black text-sm">₹49 forever</div>
            </div>
          </div>

          {user && (
            <div className="mt-5">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${
                user.plan === 'premium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                user.plan === 'pro' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                'bg-white/5 border-white/10 text-zinc-400'
              }`}>
                {user.plan === 'premium' ? '👑' : user.plan === 'pro' ? '⚡' : '🆓'}
                Current plan: {user.plan.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start mb-12">
          {plans.map(plan => {
            const planLevel = LEVELS[plan.key];
            const isCurrentPlan = user?.plan === plan.key;
            const canUpgrade = planLevel > userLevel;
            const isLoading = processing === plan.key;
            const isDisabled = isCurrentPlan || (!canUpgrade && plan.key !== 'free') || (plan.key === 'free' && !!user);

            return (
              <div key={plan.key} className={`relative rounded-2xl p-7 flex flex-col transition-all duration-200 ${
                plan.highlight
                  ? 'shadow-2xl shadow-indigo-500/15'
                  : 'hover:translate-y-[-2px]'
              }`} style={{
                background: plan.highlight ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                border: plan.highlight ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}>

                {/* Tags */}
                {plan.tag && !isCurrentPlan && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full text-white ${
                    plan.highlight ? 'bg-indigo-600' : 'bg-yellow-500'
                  }`}>
                    {plan.tag}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3.5 right-4 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                    ✓ Active
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {plan.icon}
                    <span className="text-white font-black text-xl">{plan.name}</span>
                  </div>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    {plan.price !== '₹0' && (
                      <span className="text-zinc-500 text-sm mb-2">/ {plan.period}</span>
                    )}
                    {plan.price === '₹0' && (
                      <span className="text-zinc-500 text-sm mb-2">/ {plan.period}</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f.text} className={`flex items-start gap-2.5 ${!f.included ? 'opacity-35' : ''}`}>
                      {f.included
                        ? <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-emerald-400'}`} />
                        : <Lock size={14} className="mt-0.5 flex-shrink-0 text-zinc-600" />}
                      <span className="text-zinc-300 text-sm leading-snug">{f.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (plan.key === 'free' && !user) navigate('/signup');
                    else if (plan.key !== 'free' && canUpgrade) handleUpgrade(plan.key);
                  }}
                  disabled={isDisabled || isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isCurrentPlan
                      ? 'cursor-default text-emerald-400'
                      : isDisabled
                      ? 'cursor-not-allowed opacity-40 text-zinc-500'
                      : plan.ctaStyle
                  }`}
                  style={isCurrentPlan ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' } : undefined}
                >
                  {isLoading && <Loader2 size={15} className="animate-spin" />}
                  {isCurrentPlan ? '✓ Current Plan' : isLoading ? 'Processing...' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Why so cheap section */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={18} className="text-indigo-400" />
            <h3 className="text-white font-bold text-lg">Why is RecruitIQ so affordable?</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎓', title: 'Built for Students', desc: 'We know job hunting is tough. Our pricing is set so every student can afford AI-powered career tools.' },
              { icon: '💡', title: 'One-Time Payment', desc: 'No monthly traps. Pay once and get access forever — including all future updates.' },
              { icon: '🚀', title: 'Our Mission', desc: 'We believe AI career tools should be accessible to everyone, not just those who can afford ₹2000/month.' },
            ].map(item => (
              <div key={item.title}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-bold text-lg mb-6">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'Is this really a one-time payment?', a: 'Yes! Pay once and use forever. No auto-renewals, no monthly charges, no surprises.' },
              { q: 'What payment methods are accepted?', a: 'UPI, debit card, credit card, net banking — all major Indian payment methods via Razorpay.' },
              { q: 'Can I get a refund?', a: 'Yes, within 7 days if the AI analysis doesn\'t work for your resume. Contact support.' },
              { q: 'Is my resume data safe?', a: 'Your resume is only used to generate your analysis. We never share or sell your data.' },
            ].map(item => (
              <div key={item.q}>
                <p className="text-white text-sm font-semibold mb-1">{item.q}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security footer */}
        <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-white text-sm font-semibold">100% Secure Payments by Razorpay</span>
          </div>
          <p className="text-zinc-500 text-xs">
            PCI DSS compliant · SSL encrypted · No card details stored
            <br />
            Questions? <a href="mailto:support@recruitiq.ai" className="text-indigo-400 hover:text-indigo-300 transition-colors">support@recruitiq.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
