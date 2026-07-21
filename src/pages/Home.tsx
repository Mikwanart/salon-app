import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import ServiceCard from '../components/ServiceCard';
import SalonCard from '../components/SalonCard';
import SkeletonCard from '../components/SkeletonCard';
import { services, mapApiSalonToFrontendSalon, salons, type Salon } from '../data';
import { fetchSalons } from '../lib/api';
import './Home.css';

export default function Home() {
    const [activeCategory, setActiveCategory] = useState('All Services');
    const [isLoading, setIsLoading] = useState(true);
    const [salonQuery, setSalonQuery] = useState('');
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [apiSalons, setApiSalons] = useState<Salon[]>([]);

    // Detect user coordinates on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.log("Geolocation prompt skipped or rejected:", error);
                }
            );
        }
    }, []);

    useEffect(() => {
        const loadSalons = async () => {
            setIsLoading(true);
            try {
                const data = await fetchSalons();
                if (Array.isArray(data) && data.length > 0) {
                    setApiSalons(data.map((s: any) => mapApiSalonToFrontendSalon(s, userCoords)));
                } else {
                    setApiSalons(salons);
                }
            } catch (err) {
                console.error("Failed to fetch salons:", err);
                setApiSalons(salons);
            } finally {
                setIsLoading(false);
            }
        };
        loadSalons();
    }, [userCoords]);

    const filteredServices =
        activeCategory === 'All Services'
            ? services.slice(0, 4)
            : services.filter((s) => s.category === activeCategory).slice(0, 4);

    const filteredSalons = useMemo(() => {
        let list = [...apiSalons];
        if (salonQuery.trim()) {
            const q = salonQuery.toLowerCase();
            list = list.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.location.toLowerCase().includes(q)
            );
        }
        
        // Sort by closest distance first
        if (userCoords) {
            list.sort((a, b) => {
                const distA = parseFloat(a.distance) || 0;
                const distB = parseFloat(b.distance) || 0;
                return distA - distB;
            });
        }
        return list;
    }, [salonQuery, apiSalons, userCoords]);

    return (
        <main className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content container">
                    <p className="hero-tagline">The Premium Beauty Experience</p>
                    <h1>
                        Your beauty, <em>scheduled.</em>
                    </h1>
                    <p className="hero-subtitle">
                        Discover and book the best beauty services in your city. From
                        precision cuts to revitalizing facials.
                    </p>
                    <SearchBar variant="hero" onQueryChange={setSalonQuery} />
                </div>
            </section>

            {/* Category Pills */}
            <section className="section categories-section">
                <div className="container">
                    <CategoryPills active={activeCategory} onChange={setActiveCategory} />
                </div>
            </section>

            {/* Trending Services */}
            <section className="section trending-section">
                <div className="container">
                    <div className="section-header section-header-row">
                        <div>
                            <h2>Trending Services</h2>
                            <p>The most booked treatments this week</p>
                        </div>
                        <Link to="/services" className="view-all-link">
                            View All →
                        </Link>
                    </div>
                    <div className="services-grid">
                        {isLoading
                            ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} variant="service" />)
                            : filteredServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))
                        }
                    </div>
                </div>
            </section>

            {/* Featured Salons */}
            <section className="section featured-section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center' }}>
                        <h2>Featured Salons</h2>
                        <p>
                            {salonQuery
                                ? `${filteredSalons.length} salon${filteredSalons.length !== 1 ? 's' : ''} matching "${salonQuery}"`
                                : 'Partner venues with top-tier ratings'}
                        </p>
                    </div>
                    <div className="salons-grid">
                        {isLoading
                            ? [1, 2, 3].map((i) => <SkeletonCard key={i} variant="salon" />)
                            : filteredSalons.length > 0
                                ? filteredSalons.map((salon) => (
                                    <SalonCard key={salon.id} salon={salon} />
                                ))
                                : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No salons found for "{salonQuery}"</p>
                                        <button className="btn btn-outline" onClick={() => setSalonQuery('')}>Clear Search</button>
                                    </div>
                                )
                        }
                    </div>
                </div>
            </section>
        </main>
    );
}

