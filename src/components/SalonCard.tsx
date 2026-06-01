import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Salon } from '../data';
import './SalonCard.css';

interface Props {
    salon: Salon;
}

function getFavourites(): string[] {
    try {
        return JSON.parse(localStorage.getItem('salon_favourites') || '[]');
    } catch {
        return [];
    }
}

export default function SalonCard({ salon }: Props) {
    const [isFav, setIsFav] = useState(() => getFavourites().includes(salon.id));

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=60&w=400';
    };

    const toggleFavourite = (e: React.MouseEvent) => {
        e.preventDefault(); // don't navigate
        const favs = getFavourites();
        let updated: string[];
        if (isFav) {
            updated = favs.filter((id) => id !== salon.id);
        } else {
            updated = [...favs, salon.id];
        }
        localStorage.setItem('salon_favourites', JSON.stringify(updated));
        setIsFav(!isFav);
    };

    return (
        <div className="salon-card">
            <div className="salon-card-image">
                <img
                    src={salon.image}
                    alt={salon.name}
                    onError={handleImageError}
                />
                <span className="badge badge-rating salon-rating">
                    ★ {salon.rating}
                </span>
                <button
                    className={`salon-fav-btn ${isFav ? 'active' : ''}`}
                    onClick={toggleFavourite}
                    aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                    <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className="salon-card-body">
                <h4>{salon.name}</h4>
                <div className="salon-meta">
                    <span className="salon-stars">★ {salon.rating}</span>
                    <span className="salon-location">📍 {salon.location} • {salon.distance}</span>
                </div>
                <p className="salon-reviews">{salon.reviewCount.toLocaleString()} Reviews</p>
                <Link to={`/salon/${salon.id}`} className="btn btn-outline salon-book-btn">
                    Quick Book
                </Link>
            </div>
        </div>
    );
}

