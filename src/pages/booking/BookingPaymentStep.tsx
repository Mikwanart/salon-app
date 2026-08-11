import { useState } from 'react';
import { type Service } from '../../data';
import { CreditCard, Banknote, ArrowRight, ChevronLeft } from 'lucide-react';

interface BookingPaymentStepProps {
    serviceDetails?: Service;
    selectedDate: string;
    selectedTime: string;
    stylistName: string;
    isSubmitting: boolean;
    onPay: (method: 'momo' | 'card' | 'cash', details: any) => void;
    onBack: () => void;
}

export default function BookingPaymentStep({
    serviceDetails,
    selectedDate,
    selectedTime,
    stylistName,
    isSubmitting,
    onPay,
    onBack
}: BookingPaymentStepProps) {
    const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | 'cash' | ''>('');
    const [momoPhone, setMomoPhone] = useState('');
    
    const servicePrice = serviceDetails?.price || 0;
    const bookingFee = 5.00;
    const vat = servicePrice * 0.1; // 10% VAT
    const total = servicePrice + bookingFee + vat;

    const handleProceed = () => {
        if (!paymentMethod) return;

        if (paymentMethod === 'momo') {
            const cleanedPhone = momoPhone.replace(/\s+/g, '');
            if (!/^0[0-9]{9}$/.test(cleanedPhone)) {
                alert('Please enter a valid 10-digit Ghana MoMo number (e.g. 0241234567)');
                return;
            }
            onPay('momo', { phone: cleanedPhone });
        } else {
            onPay(paymentMethod, {});
        }
    };

    return (
        <div className="booking-payment-step max-w-[1152px] mx-auto">
            <div className="payment-layout">
                {/* Left Column: Payment Options */}
                <div className="calendar-col">
                    <h2 className="step-title mb-2">Select Payment Method</h2>
                    <p className="step-subtitle mb-8">Choose your preferred way to pay for your premium experience.</p>
                    
                    <div className="payment-methods-list space-y-4">
                        {/* Credit/Debit Card */}
                        <div 
                            className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                        >
                            <div className="payment-method-header-inner">
                                <div className="payment-icon-box">
                                    <CreditCard size={28} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="payment-name">Credit / Debit Card</h3>
                                    <div className="payment-icons">
                                        <div className="card-badge">VISA</div>
                                        <div className="card-badge">MASTERCARD</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MTN Mobile Money */}
                        <div 
                            className={`payment-method-card ${paymentMethod === 'momo' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('momo')}
                        >
                            <div className="payment-method-header-inner">
                                <div className="payment-icon-box momo-bg">
                                    <span className="momo-text">MTN</span>
                                </div>
                                <div>
                                    <h3 className="payment-name">MTN Mobile Money</h3>
                                    <p className="payment-desc">Pay directly with your mobile wallet</p>
                                </div>
                            </div>
                            {paymentMethod === 'momo' && (
                                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        MoMo Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 0241234567"
                                        value={momoPhone}
                                        onChange={e => setMomoPhone(e.target.value)}
                                        maxLength={10}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1.5px solid var(--primary)',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                        autoFocus
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                        Enter the number registered with MTN MoMo
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pay with Cash */}
                        <div 
                            className={`payment-method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('cash')}
                        >
                            <div className="payment-method-header-inner">
                                <div className="payment-icon-box">
                                    <Banknote size={28} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="payment-name">Pay with Cash</h3>
                                    <p className="payment-desc">Settle your payment at the salon counter</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Summary Sidebar */}
                <div className="time-col">
                    <div className="payment-summary-sidebar sticky top-32">
                        <h3 className="summary-title mb-6">Booking Summary</h3>
                        
                        <div className="space-y-6">
                            {/* Service & Stylist Info */}
                            <div className="summary-service-info">
                                <img 
                                    src={serviceDetails?.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400'} 
                                    alt={serviceDetails?.name || 'Service'} 
                                    className="summary-service-img" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400';
                                    }}
                                />
                                <div>
                                    <h4 className="summary-service-name">{serviceDetails?.name || 'Selected Service'}</h4>
                                    <p className="summary-stylist-name">with {stylistName}</p>
                                </div>
                            </div>

                            {/* Date & Time Info */}
                            <div className="summary-datetime-grid">
                                <div className="summary-datetime-box">
                                    <p className="summary-datetime-label">Date</p>
                                    <p className="summary-datetime-val">{selectedDate ? new Date(selectedDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                                </div>
                                <div className="summary-datetime-box">
                                    <p className="summary-datetime-label">Time</p>
                                    <p className="summary-datetime-val">{selectedTime}</p>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="summary-price-breakdown">
                                <div className="price-row">
                                    <span>Service Total</span>
                                    <span>GH₵{servicePrice.toFixed(2)}</span>
                                </div>
                                <div className="price-row">
                                    <span>Booking Fee</span>
                                    <span>GH₵{bookingFee.toFixed(2)}</span>
                                </div>
                                <div className="price-row">
                                    <span>VAT (10%)</span>
                                    <span>GH₵{vat.toFixed(2)}</span>
                                </div>
                                <div className="price-row total-row pt-4 mt-2">
                                    <span className="total-label">Total Amount</span>
                                    <span className="total-val">GH₵{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button 
                                className="payment-proceed-btn"
                                disabled={!paymentMethod || isSubmitting}
                                onClick={handleProceed}
                            >
                                {isSubmitting ? (
                                    <span>Processing...</span>
                                ) : (
                                    <>
                                        <span>{paymentMethod === 'cash' ? 'Confirm Appointment' : 'Proceed to Pay'}</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                            
                            <p className="terms-text">
                                By clicking proceed, you agree to our <a href="#">Terms of Service</a> and <a href="#">Cancellation Policy</a>.
                            </p>
                        </div>
                    </div>

                    {/* Reschedule/Back Button */}
                    <button className="modify-btn mt-6" onClick={onBack}>
                        <ChevronLeft size={16} />
                        <span>Modify Appointment Details</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
