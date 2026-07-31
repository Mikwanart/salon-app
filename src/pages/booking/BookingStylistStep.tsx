import { useEffect, useState } from 'react';
import { type Stylist } from '../../data';
import { Star } from 'lucide-react';

interface BookingStylistStepProps {
    availableStylists: Stylist[];
    selectedStylist: string;
    onSelectStylist: (id: string) => void;
    onNext: () => void;
}

export default function BookingStylistStep({
    availableStylists,
    selectedStylist,
    onSelectStylist,
    onNext
}: BookingStylistStepProps) {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    return (
        <div className="booking-stylist-step">
            <div className="booking-step-header mb-8 text-center md:text-left">
                <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Choose Your Stylist</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Select an expert who matches your vision and style preference.</p>
            </div>

            <div className="stylists-grid">
                {availableStylists.map((stylist, index) => {
                    const isSelected = selectedStylist === stylist.id;
                    return (
                        <div 
                            key={stylist.id} 
                            className={`stylist-card ${animateIn ? 'animate-in' : ''} ${isSelected ? 'selected' : ''}`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className="stylist-image-wrapper">
                                {/* Use an actual image from stylist data if available, fallback to placeholder */}
                                <img 
                                    src={stylist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(stylist.name)}&background=random&color=fff&size=400`} 
                                    alt={stylist.name} 
                                    className="stylist-image"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stylist.name)}&background=random&color=fff&size=400`;
                                    }}
                                />
                                <div className="stylist-rating-badge">
                                    <Star size={14} className="star-icon" fill="currentColor" />
                                    <span>{stylist.rating || '4.9'}</span>
                                </div>
                            </div>
                            <div className="stylist-content">
                                <div className="stylist-header">
                                    <h3 className="stylist-name">{stylist.name}</h3>
                                    <p className="stylist-role">{stylist.role}</p>
                                </div>
                                <p className="stylist-bio line-clamp-2">
                                    {stylist.bio || '\u00A0'}
                                </p>
                                <div className="stylist-tags">
                                    {stylist.specialties?.slice(0, 3).map((sp) => (
                                        <span key={sp} className="stylist-tag">{sp}</span>
                                    ))}
                                </div>
                                <button 
                                    className={`stylist-select-btn ${isSelected ? 'selected' : ''}`}
                                    onClick={() => onSelectStylist(stylist.id)}
                                >
                                    {isSelected ? 'Stylist Selected' : 'Select Stylist'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="bottom-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    type="button"
                    className="confirm-booking-btn"
                    disabled={!selectedStylist}
                    onClick={onNext}
                    style={{ 
                        opacity: selectedStylist ? 1 : 0.5, 
                        cursor: selectedStylist ? 'pointer' : 'not-allowed'
                    }}
                >
                    Next Step: Choose Time →
                </button>
            </div>
        </div>
    );
}
