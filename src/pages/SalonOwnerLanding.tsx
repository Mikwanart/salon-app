import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SalonOwnerLanding.css';

export default function SalonOwnerLanding() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'Owner';

    return (
        <main className="sol-page">
            {/* Hero */}
            <section className="sol-hero">
                <div className="sol-hero-overlay" />

                {/* Floating accent orbs */}
                <div className="sol-orb sol-orb--1" />
                <div className="sol-orb sol-orb--2" />

                <div className="sol-hero-content">

                    <h1 className="sol-headline">
                        Welcome back,{' '}
                        <em className="sol-name">{firstName}</em>.<br />
                        Your business awaits.
                    </h1>

                    <p className="sol-subtitle">
                        Manage appointments, track revenue, update your services,
                        and grow your salon — all from one powerful dashboard.
                    </p>

                    <div className="sol-cta-row">
                        <Link to="/dashboard" className="sol-btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                            </svg>
                            Go to Dashboard
                        </Link>

                    </div>
                </div>
            </section>

            {/* Feature highlights */}
            <section id="sol-features" className="sol-features">
                <div className="sol-features-inner">
                    <div className="sol-feature-card">
                        <div className="sol-feature-icon sol-icon--purple">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                            </svg>
                        </div>
                        <h3>Appointment Management</h3>
                        <p>View, approve, and reschedule bookings with a clean, real-time calendar view.</p>
                    </div>

                    <div className="sol-feature-card">
                        <div className="sol-feature-icon sol-icon--rose">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                            </svg>
                        </div>
                        <h3>Revenue Analytics</h3>
                        <p>Track daily earnings, top services, and monthly trends with beautiful charts.</p>
                    </div>

                    <div className="sol-feature-card">
                        <div className="sol-feature-icon sol-icon--gold">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                            </svg>
                        </div>
                        <h3>Service Catalogue</h3>
                        <p>Add, edit, and price your services in seconds — keeping your listing always up to date.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
