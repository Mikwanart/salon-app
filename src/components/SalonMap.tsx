import { MapPin, ExternalLink } from 'lucide-react';
import './SalonMap.css';

interface SalonMapProps {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    height?: number;
}

export default function SalonMap({ name, address, coordinates, height = 220 }: SalonMapProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    const hasKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

    const embedSrc = hasKey
        ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=15`
        : `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`;

    return (
        <div className="salon-map-wrapper">
            {embedSrc ? (
                <iframe
                    title={`Map of ${name}`}
                    src={embedSrc}
                    width="100%"
                    height={height}
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            ) : (
                /* Fallback: static map placeholder with directions link */
                <div className="map-fallback" style={{ height }}>
                    <div className="map-fallback-inner">
                        <div className="map-pin-icon">
                            <MapPin size={32} />
                        </div>
                        <p className="map-fallback-name">{name}</p>
                        <p className="map-fallback-address">{address}</p>
                        <p className="map-fallback-note">
                            Add your Google Maps API key to<br />
                            <code>.env</code> to enable the live map.
                        </p>
                    </div>
                </div>
            )}
            <a
                className="map-directions-link"
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                <MapPin size={15} />
                Get Directions
                <ExternalLink size={13} />
            </a>
        </div>
    );
}
