import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { registerSalon } from '../lib/api';
import { TrendingUp, Calendar, Star, Shield, BarChart2, Users } from 'lucide-react';
import './ForSalons.css';

const features = [
    {
        icon: <Calendar size={28} />,
        title: 'Smart Scheduling',
        desc: 'Let clients book online 24/7. Automated reminders cut no-shows by up to 60%.',
    },
    {
        icon: <BarChart2 size={28} />,
        title: 'Business Analytics',
        desc: 'Real-time dashboards showing revenue, top services, and peak booking hours.',
    },
    {
        icon: <Users size={28} />,
        title: 'Client Management',
        desc: 'Keep full client history, preferences, and contact info in one place.',
    },
    {
        icon: <Star size={28} />,
        title: 'Reviews & Reputation',
        desc: 'Collect verified reviews automatically after each appointment.',
    },
    {
        icon: <TrendingUp size={28} />,
        title: 'Grow Your Reach',
        desc: 'Get listed in our discovery feed and reach thousands of new clients monthly.',
    },
    {
        icon: <Shield size={28} />,
        title: 'Secure Payments',
        desc: 'Accept deposits and payments online. Stripe-powered, fully encrypted.',
    },
];

const plans = [
    {
        name: 'Starter',
        price: 'Free',
        period: '',
        features: ['Up to 2 stylists', 'Online booking page', 'Basic analytics', 'Email reminders'],
        cta: 'Get Started',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$49',
        period: '/ month',
        features: ['Unlimited stylists', 'Priority listing', 'Advanced analytics', 'SMS reminders', 'Review management'],
        cta: 'Start Free Trial',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Multi-location support', 'Dedicated success manager', 'Custom integrations', 'White-label option'],
        cta: 'Contact Sales',
        highlight: false,
    },
];

export default function ForSalons() {
    const { isLoggedIn, login, isSalonOwner } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', address: '', city: '', state: '', phone: '', email: '' });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            await registerSalon(token, formData);
            window.location.href = '/dashboard'; // Force full reload to resync user role
        } catch(e) {
            console.error('Registration failed', e);
            alert('Failed to register salon. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="for-salons-page">
            {/* Hero */}
            <section className="fs-hero">
                <div className="container fs-hero-inner">
                    <div className="fs-hero-text">
                        <span className="fs-badge">For Salon Owners</span>
                        <h1>Grow your salon with <em>SalonBook</em></h1>
                        <p>The all-in-one platform to manage bookings, wow clients, and grow your business — starting free.</p>
                        <div className="fs-hero-actions">
                            {!isRegistering ? (
                                <>
                                    {!isLoggedIn ? (
                                        <button onClick={() => login()} className="btn btn-primary">Get Started Free</button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <button onClick={() => setIsRegistering(true)} className="btn btn-primary">Create Your Salon</button>
                                            {isSalonOwner && <Link to="/dashboard" className="btn btn-outline">Go to Dashboard</Link>}
                                        </div>
                                    )}
                                    <a href="#features" className="btn btn-outline">See Features →</a>
                                </>
                            ) : (
                                <form onSubmit={handleRegister} className="fs-reg-form fade-in">
                                    <h3>Register Your Salon</h3>
                                    
                                    <div className="form-group" style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Salon Name</label>
                                        <input type="text" className="fs-reg-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    
                                    <div className="form-group" style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Phone Number</label>
                                        <input type="tel" className="fs-reg-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                                    </div>
                                    
                                    <div className="form-group" style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Street Address</label>
                                        <input type="text" className="fs-reg-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>City</label>
                                            <input type="text" className="fs-reg-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Region</label>
                                            <input type="text" className="fs-reg-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>{isSubmitting ? 'Registering...' : 'Complete Registration'}</button>
                                        <button type="button" className="btn btn-outline" onClick={() => setIsRegistering(false)}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="fs-hero-stats">
                        <div className="fs-stat"><span className="fs-stat-val">12,000+</span><span>Salons</span></div>
                        <div className="fs-stat"><span className="fs-stat-val">4.9★</span><span>Avg Rating</span></div>
                        <div className="fs-stat"><span className="fs-stat-val">2M+</span><span>Bookings/mo</span></div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section" id="features">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center' }}>
                        <h2>Everything you need to run a modern salon</h2>
                        <p>Powerful tools, beautifully simple to use.</p>
                    </div>
                    <div className="fs-features-grid">
                        {features.map((f) => (
                            <div key={f.title} className="fs-feature-card">
                                <div className="fs-feature-icon">{f.icon}</div>
                                <h4>{f.title}</h4>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="section fs-pricing-section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center' }}>
                        <h2>Simple, transparent pricing</h2>
                        <p>No setup fees. No hidden costs. Cancel anytime.</p>
                    </div>
                    <div className="fs-plans-grid">
                        {plans.map((plan) => (
                            <div key={plan.name} className={`fs-plan-card ${plan.highlight ? 'highlight' : ''}`}>
                                {plan.highlight && <span className="fs-popular-badge">Most Popular</span>}
                                <h3>{plan.name}</h3>
                                <div className="fs-price">
                                    <span className="fs-price-val">{plan.price}</span>
                                    <span className="fs-price-period">{plan.period}</span>
                                </div>
                                <ul className="fs-plan-features">
                                    {plan.features.map((feat) => (
                                        <li key={feat}>✓ {feat}</li>
                                    ))}
                                </ul>
                                <button onClick={() => !isLoggedIn ? login() : setIsRegistering(true)} className={`btn ${plan.highlight ? 'btn-primary' : 'btn-outline'} fs-plan-btn`}>
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="fs-cta-section">
                <div className="container fs-cta-inner">
                    <h2>Ready to transform your salon?</h2>
                    <p>Join thousands of salon owners who trust SalonBook to run their business.</p>
                    {!isLoggedIn ? (
                        <button onClick={() => login()} className="btn btn-primary">Create Free Account</button>
                    ) : isSalonOwner ? (
                        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    ) : (
                        <button onClick={() => { setIsRegistering(true); window.scrollTo(0,0); }} className="btn btn-primary">Create Your Salon</button>
                    )}
                </div>
            </section>
        </main>
    );
}
