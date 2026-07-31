import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

import ServiceCard from '../components/ServiceCard';
import SalonCard from '../components/SalonCard';
import SkeletonCard from '../components/SkeletonCard';
import { services, mapApiSalonToFrontendSalon, salons, type Salon } from '../data';
import { fetchSalons } from '../lib/api';
import './Home.css';

export default function Home() {

    const [isLoading, setIsLoading] = useState(true);
    const [salonQuery, setSalonQuery] = useState('');
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [apiSalons, setApiSalons] = useState<Salon[]>([]);

    const [rawApiData, setRawApiData] = useState<any[]>([]);

    // Detect user coordinates on mount (separate from salon fetch)
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

    // Fetch salons ONCE on mount — independent of geolocation
    useEffect(() => {
        const loadSalons = async () => {
            setIsLoading(true);
            try {
                const data = await fetchSalons();
                if (Array.isArray(data) && data.length > 0) {
                    setRawApiData(data);
                    setApiSalons(data.map((s: any) => mapApiSalonToFrontendSalon(s, null)));
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
    }, []); // ← empty deps: fetch only once

    // When geolocation resolves, remap distances client-side without a new API call
    useEffect(() => {
        if (userCoords && rawApiData.length > 0) {
            setApiSalons(rawApiData.map((s: any) => mapApiSalonToFrontendSalon(s, userCoords)));
        }
    }, [userCoords, rawApiData]);

    // Always show the same fixed 4 trending services; resolve salonId from live data for booking links
    const trendingServices = services.slice(0, 4);
    const serviceSalonMap = useMemo(() => {
        const salonMap = new Map<string, string>(); // service name -> salonId
        apiSalons.forEach(salon =>
            salon.services.forEach(s => {
                if (!salonMap.has(s.name)) salonMap.set(s.name, salon.id);
            })
        );
        return salonMap;
    }, [apiSalons]);

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
                    <h1>
                        <span style={{ color: '#b10e6b' }}>Book</span> your style in seconds.
                    </h1>
                    <p className="hero-subtitle">
                        Discover and book top beauty & hair studios near you.
                    </p>
                    <SearchBar variant="hero" onQueryChange={setSalonQuery} />
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
                            : trendingServices.map((service) => (
                                <ServiceCard key={service.id} service={service} salonId={serviceSalonMap.get(service.name)} />
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

