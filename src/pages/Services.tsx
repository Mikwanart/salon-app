import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import ServiceCard from '../components/ServiceCard';
import { mapApiSalonToFrontendSalon, salons, type Salon, type Service } from '../data';
import { fetchSalons } from '../lib/api';
import './Services.css';

export default function Services() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [apiSalons, setApiSalons] = useState<Salon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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

    const activeCategory = searchParams.get('category') || 'All Services';
    const query = searchParams.get('q') || '';
    const locationQuery = searchParams.get('l') || '';

    const [priceRange, setPriceRange] = useState(300);
    const [minRating, setMinRating] = useState(0);
    const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
    const [openNow, setOpenNow] = useState(false);
    const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>('recommended');

    const setCategory = (category: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (category === 'All Services') { newParams.delete('category'); } else { newParams.set('category', category); }
        setSearchParams(newParams);
    };

    const handleQueryChange = (q: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (q) { newParams.set('q', q); } else { newParams.delete('q'); }
        setSearchParams(newParams, { replace: true });
    };

    const toggleDistance = (distance: string) => {
        setSelectedDistances(prev => prev.includes(distance) ? prev.filter(d => d !== distance) : [...prev, distance]);
    };

    // Check if a salon is open right now based on its hours string
    const isSalonOpenNow = (hours: string): boolean => {
        const now = new Date();
        const hour = now.getHours();
        // Simple heuristic: look for AM/PM hours in the hours string
        const match = hours.match(/(\d+)AM\s*-\s*(\d+)PM/);
        if (!match) return true;
        const open = parseInt(match[1]);
        const close = parseInt(match[2]) + 12;
        return hour >= open && hour < close;
    };

    const finalServices = useMemo(() => {
        const allServices = apiSalons.flatMap(salon => salon.services);
        const salons = apiSalons;

        let result = allServices.filter((s: Service) => {
            if (activeCategory !== 'All Services' && s.category !== activeCategory) return false;
            if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.category.toLowerCase().includes(query.toLowerCase())) return false;
            if (locationQuery) {
                const salonInLoc = salons.some(salon => salon.location.toLowerCase().includes(locationQuery.toLowerCase()) && salon.services.some(sv => sv.id === s.id));
                if (!salonInLoc) return false;
            }
            if (s.price > priceRange) return false;
            if (minRating > 0) {
                const hasQualifyingSalon = salons.some(salon => salon.rating >= minRating && salon.services.some(sv => sv.id === s.id));
                if (!hasQualifyingSalon) return false;
            }
            if (openNow) {
                const hasOpenSalon = salons.some(salon => salon.services.some(sv => sv.id === s.id) && isSalonOpenNow(salon.hours));
                if (!hasOpenSalon) return false;
            }
            return true;
        });

        // Sort
        if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
        else if (sortBy === 'rating') {
            result = [...result].sort((a, b) => {
                const ratingA = Math.max(...salons.filter(sl => sl.services.some(sv => sv.id === a.id)).map(sl => sl.rating), 0);
                const ratingB = Math.max(...salons.filter(sl => sl.services.some(sv => sv.id === b.id)).map(sl => sl.rating), 0);
                return ratingB - ratingA;
            });
        }

        return result;
    }, [activeCategory, query, locationQuery, priceRange, minRating, openNow, sortBy, apiSalons]);

    return (
        <main className="services-page">
            <section className="services-hero">
                <div className="container">
                    <h1>Find Your Perfect Service</h1>
                    <p>Browse our complete catalog of beauty treatments</p>
                    <SearchBar variant="page" initialQuery={query} initialLocation={locationQuery} onQueryChange={handleQueryChange} />
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <CategoryPills active={activeCategory} onChange={setCategory} />
                </div>
            </section>

            <section className="section services-content">
                <div className="container services-layout">
                    <aside className="services-sidebar">
                        <div className="filter-group">
                            <h4>Price Range</h4>
                            <input type="range" min="20" max="300" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="price-slider" />
                            <div className="price-labels">
                                <span>$20</span>
                                <span className="price-current">${priceRange}</span>
                                <span>$300</span>
                            </div>
                        </div>

                        <div className="filter-group">
                            <h4>Rating</h4>
                            <div className="rating-options">
                                {[5, 4, 3].map((r) => (
                                    <label key={r} className="rating-option">
                                        <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} />
                                        <span>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                                        <span className="rating-text">{r}+ Stars</span>
                                    </label>
                                ))}
                                <button className="btn-link" onClick={() => setMinRating(0)} style={{ fontSize: '0.8rem', marginTop: '8px', cursor: 'pointer', color: 'var(--primary)' }}>Clear Rating</button>
                            </div>
                        </div>

                        <div className="filter-group">
                            <h4>Distance</h4>
                            <div className="distance-options">
                                {['0-1 mi', '1-3 mi', '3-5 mi', '5+ mi'].map((d) => (
                                    <label key={d} className="distance-option">
                                        <input type="checkbox" checked={selectedDistances.includes(d)} onChange={() => toggleDistance(d)} />
                                        <span>{d}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Open Now Toggle */}
                        <div className="filter-group">
                            <h4>Availability</h4>
                            <label className="toggle-filter">
                                <div
                                    className={`toggle-switch ${openNow ? 'on' : ''}`}
                                    onClick={() => setOpenNow(v => !v)}
                                    role="switch"
                                    aria-checked={openNow}
                                >
                                    <div className="toggle-knob" />
                                </div>
                                <span>Open Now</span>
                            </label>
                        </div>
                    </aside>

                    <div className="services-results">
                        {/* Sort Bar */}
                        <div className="results-bar">
                            <p className="results-count">
                                {finalServices.length} {finalServices.length === 1 ? 'service' : 'services'} found
                                {query && <span> for "{query}"</span>}
                            </p>
                            <div className="sort-control">
                                <label htmlFor="sort-select">Sort:</label>
                                <select
                                    id="sort-select"
                                    className="sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                >
                                    <option value="recommended">Recommended</option>
                                    <option value="price-asc">Price: Low → High</option>
                                    <option value="price-desc">Price: High → Low</option>
                                    <option value="rating">Highest Rated</option>
                                </select>
                            </div>
                        </div>

                        <div className="services-grid">
                            {isLoading ? (
                                <p>Loading services...</p>
                            ) : (
                                finalServices.map((service) => (
                                    <ServiceCard key={service.id} service={service} />
                                ))
                            )}
                        </div>
                        {!isLoading && finalServices.length === 0 && (
                            <div className="no-results">
                                <p>No services found matching your criteria.</p>
                                <button className="btn btn-outline" onClick={() => {
                                    setSearchParams({});
                                    setPriceRange(300);
                                    setMinRating(0);
                                    setSelectedDistances([]);
                                    setOpenNow(false);
                                    setSortBy('recommended');
                                }}>Clear All Filters</button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
