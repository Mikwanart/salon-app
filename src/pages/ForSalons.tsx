import { Link } from 'react-router-dom';
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
                            <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
                            <a href="#features" className="btn btn-outline">See Features →</a>
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
                                <Link to="/signup" className={`btn ${plan.highlight ? 'btn-primary' : 'btn-outline'} fs-plan-btn`}>
                                    {plan.cta}
                                </Link>
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
                    <Link to="/signup" className="btn btn-primary">Create Free Account</Link>
                </div>
            </section>
        </main>
    );
}
