import { Link } from 'react-router-dom';
import type { Service } from '../data';
import './ServiceCard.css';

interface Props {
    service: Service;
    salonId?: string;
}

export default function ServiceCard({ service, salonId }: Props) {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=60&w=400'; // African beauty fallback
    };

    const serviceParam = service.id || encodeURIComponent(service.name);
    const bookingUrl = salonId
        ? `/booking?salon=${salonId}&service=${serviceParam}`
        : `/booking?service=${serviceParam}`;

    return (
        <Link to={bookingUrl} className="service-card">
            <div className="service-card-image">
                <img
                    src={service.image}
                    alt={service.name}
                    onError={handleImageError}
                />
                <span className="badge badge-primary service-badge">{service.category}</span>
            </div>
            <div className="service-card-body">
                <h4>{service.name}</h4>
                <p className="service-price">GH₵{service.price}</p>
            </div>
        </Link>
    );
}
