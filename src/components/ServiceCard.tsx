import { Link } from 'react-router-dom';
import type { Service } from '../data';
import './ServiceCard.css';

interface Props {
    service: Service;
}

export default function ServiceCard({ service }: Props) {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=60&w=400'; // Generic beauty fallback
    };

    return (
        <Link to={`/services`} className="service-card">
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
                <p className="service-price">from ${service.price}</p>
            </div>
        </Link>
    );
}
