import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar } from 'lucide-react';
import './SearchBar.css';

interface Props {
    variant?: 'hero' | 'page';
    onQueryChange?: (q: string) => void;
    initialQuery?: string;
    initialLocation?: string;
}

export default function SearchBar({ variant = 'hero', onQueryChange, initialQuery = '', initialLocation = '' }: Props) {
    const [query, setQuery] = useState(initialQuery);
    const [location, setLocation] = useState(initialLocation);
    const [date, setDate] = useState('');
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (location) params.append('l', location);
        if (date) params.append('d', date);

        navigate(`/services?${params.toString()}`);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        onQueryChange?.(value);
    };

    return (
        <form className={`search-bar ${variant}`} onSubmit={handleSearch}>
            <div className="search-field service-field">
                <span className="search-icon">
                    <Search size={20} />
                </span>
                <input
                    type="text"
                    placeholder="Service or salon name..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                />
            </div>
            <div className="search-divider location-divider" />
            <div className="search-field location-field">
                <span className="search-icon">
                    <MapPin size={20} />
                </span>
                <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div className="search-divider date-divider" />
            <div className="search-field date-field">
                <span className="search-icon">
                    <Calendar size={20} />
                </span>
                <input
                    type="date"
                    placeholder="Any Date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-primary search-btn">Search</button>
        </form>
    );
}
