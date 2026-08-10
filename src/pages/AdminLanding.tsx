import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLanding.css';

export default function AdminLanding() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'Admin';

    return (
        <main className="adl-page">
            {/* Hero */}
            <section className="adl-hero">
                <div className="adl-hero-overlay" />

                {/* Decorative orbs */}
                <div className="adl-orb adl-orb--1" />
                <div className="adl-orb adl-orb--2" />

                <div className="adl-hero-content">
                    <h1 className="adl-headline">
                        Welcome,{' '}
                        <em className="adl-name">{firstName}</em>.<br />
                        You have full control.
                    </h1>

                    <p className="adl-subtitle">
                        Oversee salons, manage users, review appointments,
                        and monitor platform analytics — all from one place.
                    </p>

                    <div className="adl-cta-row">
                        <Link to="/admin" className="adl-btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z" />
                            </svg>
                            Open Admin Panel
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section className="adl-features">
                <div className="adl-features-inner">
                    <div className="adl-feature-card">
                        <div className="adl-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                            </svg>
                        </div>
                        <h3>Salon Management</h3>
                        <p>Approve, suspend, or review all registered salons on the platform.</p>
                    </div>

                    <div className="adl-feature-card">
                        <div className="adl-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                        </div>
                        <h3>User Control</h3>
                        <p>View all users, assign roles, and manage account permissions across the platform.</p>
                    </div>

                    <div className="adl-feature-card">
                        <div className="adl-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                            </svg>
                        </div>
                        <h3>Platform Analytics</h3>
                        <p>Track bookings, revenue trends, and platform-wide activity in real time.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
