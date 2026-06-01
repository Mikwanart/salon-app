import { Sparkles, Building2 } from 'lucide-react';
import './About.css';

const stats = [
    { value: '5,000+', label: 'Partner Salons' },
    { value: '2M+', label: 'Appointments Booked' },
    { value: '98%', label: 'Customer Satisfaction' },
    { value: '150+', label: 'Cities Covered' },
];

const team = [
    { name: 'Sarah Mitchell', role: 'CEO & Co-founder', initial: 'S' },
    { name: 'David Chen', role: 'CTO & Co-founder', initial: 'D' },
    { name: 'Lisa Park', role: 'Head of Design', initial: 'L' },
    { name: 'James Rivera', role: 'VP of Operations', initial: 'J' },
];

export default function About() {
    return (
        <main className="about-page">
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <h1>Beauty meets technology</h1>
                    <p>
                        We're on a mission to make beauty services accessible, bookable, and
                        delightful for everyone.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="section">
                <div className="container about-story">
                    <div className="about-story-text">
                        <h2>Our Story</h2>
                        <p>
                            SalonBook was born from a simple frustration: booking a salon
                            appointment shouldn't be harder than it needs to be. In 2022, our
                            founders set out to build a platform that connects beauty seekers
                            with top-rated salons, while giving salon owners powerful tools to
                            grow their business.
                        </p>
                        <p>
                            Today, we serve over 5,000 salons across 150+ cities, handling
                            millions of appointments every year. Our technology streamlines
                            scheduling, payments, and client management—so salon professionals
                            can focus on what they do best: making people look and feel amazing.
                        </p>
                    </div>
                    <div className="about-story-visual">
                        <div className="story-card">
                            <div className="story-icon"><Sparkles size={28} /></div>
                            <h3>For Clients</h3>
                            <p>Discover, compare, and book beauty services in seconds.</p>
                        </div>
                        <div className="story-card">
                            <div className="story-icon"><Building2 size={28} /></div>
                            <h3>For Salons</h3>
                            <p>Manage bookings, grow revenue, and delight your clients.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="section about-stats-section">
                <div className="container">
                    <div className="about-stats">
                        {stats.map((s) => (
                            <div key={s.label} className="about-stat">
                                <span className="about-stat-value">{s.value}</span>
                                <span className="about-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center' }}>
                        <h2>Meet the Team</h2>
                        <p>The people behind SalonBook</p>
                    </div>
                    <div className="team-grid">
                        {team.map((member) => (
                            <div key={member.name} className="team-card">
                                <div className="team-avatar">{member.initial}</div>
                                <h4>{member.name}</h4>
                                <p>{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="section about-mission">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2>Our Mission</h2>
                    <p className="mission-text">
                        To empower every salon professional and beauty seeker with technology
                        that makes appointments effortless, experiences memorable, and
                        businesses thrive.
                    </p>
                </div>
            </section>
        </main>
    );
}
