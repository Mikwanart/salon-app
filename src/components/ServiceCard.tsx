import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Droplet, Brush, Star } from 'lucide-react';
import type { Service } from '../data';
import './ServiceCard.css';

interface Props {
    service: Service;
    salonId?: string;
}

export default function ServiceCard({ service, salonId }: Props) {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.style.display = 'none';
    };

    const serviceParam = service.id || encodeURIComponent(service.name);
    const bookingUrl = salonId
        ? `/booking?salon=${salonId}&service=${serviceParam}`
        : `/booking?service=${serviceParam}`;

    return (
        <Link to={bookingUrl} className="service-card">
            <div className="service-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-variant, #f0f0f0)' }}>
                {service.image ? (
                    <img
                        src={service.image}
                        alt={service.name}
                        onError={handleImageError}
                    />
                ) : (
                    (() => {
                        const cat = service.category?.toLowerCase() || '';
                        let Icon = Star;
                        if (cat.includes('hair') || cat.includes('barber')) Icon = Scissors;
                        else if (cat.includes('nail')) Icon = Sparkles;
                        else if (cat.includes('skin')) Icon = Droplet;
                        else if (cat.includes('makeup')) Icon = Brush;
                        
                        return <Icon size={48} color="var(--primary-color, #c19b76)" />;
                    })()
                )}
            </div>
            <div className="service-card-body">
                <h4>{service.name}</h4>
                <p className="service-price">GH₵{service.price}</p>
            </div>
        </Link>
    );
}
