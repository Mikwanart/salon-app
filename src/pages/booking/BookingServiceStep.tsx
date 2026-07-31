import { useState, useMemo } from 'react';
import { type Service } from '../../data';
import { Search, Heart, Clock, ArrowRight, PlusCircle, Scissors, Sparkles, Droplet, Brush, Star } from 'lucide-react';

interface BookingServiceStepProps {
    availableServices: Service[];
    selectedService: string;
    onSelectService: (id: string) => void;
    onNext: () => void;
}

export default function BookingServiceStep({
    availableServices,
    selectedService,
    onSelectService,
    onNext
}: BookingServiceStepProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Hair', 'Nails', 'Skin'];

    const filteredServices = useMemo(() => {
        return availableServices.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  service.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || service.category.toLowerCase().includes(activeCategory.toLowerCase());
            return matchesSearch && matchesCategory;
        });
    }, [availableServices, searchQuery, activeCategory]);

    return (
        <div className="booking-service-step animate-fade-up">
            <div className="booking-step-header">
                <h2 className="step-title">Select Your Services</h2>
                <p className="step-subtitle">Choose one or more treatments for your velvet experience.</p>
            </div>

            {/* Search & Filter */}
            <div className="service-filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search services (e.g., Balayage, Manicure)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="category-tabs scrollbar-hide">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'All' ? 'All Services' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Services Grid */}
            <div className="services-grid">
                {filteredServices.map(service => {
                    const isSelected = selectedService === service.id;
                    return (
                        <div key={service.id} className="service-card group">
                            <div className="service-card-image-wrapper" style={!service.image ? { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-variant, #f0f0f0)' } : undefined}>
                                {service.image ? (
                                    <img 
                                        src={service.image} 
                                        alt={service.name} 
                                        className="service-card-image"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                                <button className="favorite-btn">
                                    <Heart size={18} />
                                </button>
                            </div>
                            <div className="service-card-content">
                                <div className="service-card-header">
                                    <h3 className="service-name">{service.name}</h3>
                                    <span className="service-price">GH₵{service.price}</span>
                                </div>
                                <p className="service-description line-clamp-2">
                                    {/* Default description if none provided */}
                                    Experience our premium {service.name.toLowerCase()} for a lasting and luxurious look.
                                </p>
                                <div className="service-card-footer">
                                    <div className="service-duration">
                                        <Clock size={16} />
                                        <span>{service.duration}</span>
                                    </div>
                                    <button 
                                        className={`service-select-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => onSelectService(isSelected ? '' : service.id)}
                                    >
                                        {isSelected ? 'Selected' : 'Select'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Add-on Card Variation */}
                <div className="service-card-custom group">
                    <div className="service-card-custom-content">
                        <PlusCircle className="custom-icon" size={48} />
                        <h3 className="custom-title">Request Custom Service</h3>
                        <p className="custom-desc">Have something specific in mind? Let us know!</p>
                        <button className="custom-btn">Contact Stylist</button>
                    </div>
                </div>
            </div>

            {/* Bottom Action Row */}
            <div className="bottom-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    type="button"
                    className="confirm-booking-btn" 
                    disabled={!selectedService}
                    onClick={onNext}
                    style={{ 
                        opacity: selectedService ? 1 : 0.5, 
                        cursor: selectedService ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span>Continue to Stylist</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
