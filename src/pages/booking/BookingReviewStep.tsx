import { type Stylist, type Service } from '../../data';
import { Calendar as CalendarIcon, Clock, MapPin, Info, Scissors, Sparkles, Droplet, Brush, Star } from 'lucide-react';

interface BookingReviewStepProps {
    stylistDetails?: Stylist;
    serviceDetails?: Service;
    selectedDate: string;
    selectedTime: string;
    salonName: string;
    salonAddress: string;
    customerDetails: {
        name: string;
        email: string;
        phone: string;
    };
    onCustomerDetailsChange: (field: string, value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function BookingReviewStep({
    stylistDetails,
    serviceDetails,
    selectedDate,
    selectedTime,
    salonName,
    salonAddress,
    onNext,
    onBack
}: BookingReviewStepProps) {

    const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Thursday, Oct 24, 2024';
    const servicePrice = serviceDetails?.price || 120;
    const tax = Number((servicePrice * 0.1).toFixed(2));
    const total = servicePrice + tax;

    return (
        <div className="review-step-container">
            {/* Step Header */}
            <div className="review-header">
                <h2 className="review-title">Review Your Appointment</h2>
                <p className="review-subtitle">
                    Please confirm the details of your {serviceDetails?.name?.toLowerCase() || 'styling'} session below.
                </p>
            </div>

            <div className="review-content">
                {/* Main Details Card */}
                <div className="review-card">
                    <div className="review-grid">
                        {/* Left Column: Service & Stylist */}
                        <div className="review-col">
                            <div className="review-section">
                                <span className="review-section-label">SERVICE</span>
                                <div className="review-item">
                                    {serviceDetails?.image ? (
                                        <img 
                                            src={serviceDetails.image} 
                                            alt="Service" 
                                            className="review-thumb"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="review-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-variant, #f0f0f0)' }}>
                                            {(() => {
                                                const cat = serviceDetails?.category?.toLowerCase() || '';
                                                let Icon = Star;
                                                if (cat.includes('hair') || cat.includes('barber')) Icon = Scissors;
                                                else if (cat.includes('nail')) Icon = Sparkles;
                                                else if (cat.includes('skin')) Icon = Droplet;
                                                else if (cat.includes('makeup')) Icon = Brush;
                                                
                                                return <Icon size={24} color="var(--primary-color, #c19b76)" />;
                                            })()}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="review-item-name">{serviceDetails?.name || 'Silk Press'}</h4>
                                        <p className="review-item-sub">{serviceDetails?.duration || '60 - 90 minutes'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="review-section">
                                <span className="review-section-label">STYLIST</span>
                                <div className="review-item">
                                    <img 
                                        src={stylistDetails?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(stylistDetails?.name || 'Stylist')}&background=random&color=fff&size=100`} 
                                        alt="Stylist" 
                                        className="review-avatar"
                                    />
                                    <div>
                                        <h4 className="review-item-name">{stylistDetails?.name || 'Sika Mensah'}</h4>
                                        <p className="review-item-sub">{stylistDetails?.role || 'Senior Texture Specialist'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Date & Time, Location */}
                        <div className="review-col">
                            <div className="review-section">
                                <span className="review-section-label">DATE & TIME</span>
                                <div className="review-meta-item">
                                    <CalendarIcon size={18} className="review-meta-icon" />
                                    <span className="review-meta-bold">{formattedDate}</span>
                                </div>
                                <div className="review-meta-item">
                                    <Clock size={18} className="review-meta-icon" />
                                    <span className="review-meta-sub">{selectedTime || '10:30 AM - 12:00 PM'}</span>
                                </div>
                            </div>

                            <div className="review-section">
                                <span className="review-section-label">LOCATION</span>
                                <div className="review-meta-item">
                                    <MapPin size={18} className="review-meta-icon" />
                                    <span className="review-meta-sub">{salonName || 'Velvet Suites'}, {salonAddress || 'Downtown District'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Summary Card */}
                <div className="review-card price-summary-card">
                    <h3 className="price-summary-title">Price Summary</h3>
                    
                    <div className="price-summary-rows">
                        <div className="price-summary-row">
                            <span>{serviceDetails?.name || 'Silk Press Service'}</span>
                            <span>GH₵{servicePrice.toFixed(2)}</span>
                        </div>
                        <div className="price-summary-row">
                            <span>Tax & Fees</span>
                            <span>GH₵{tax.toFixed(2)}</span>
                        </div>
                        <div className="price-summary-divider" />
                        <div className="price-summary-row total-row">
                            <span className="total-label">Total Price</span>
                            <span className="total-value">GH₵{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Cancellation Notice Banner */}
                <div className="cancellation-banner">
                    <Info size={18} className="cancellation-icon" />
                    <p className="cancellation-text">
                        Free cancellation up to 24 hours before your appointment. Late cancellations may incur a 50% service fee.
                    </p>
                </div>

                {/* Bottom Actions */}
                <div className="review-actions-row">
                    <button className="confirm-booking-btn" onClick={onNext}>
                        Confirm Booking
                    </button>
                    <button className="edit-details-btn" onClick={onBack}>
                        Edit Details
                    </button>
                </div>
            </div>
        </div>
    );
}
