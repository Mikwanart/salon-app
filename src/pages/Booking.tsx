import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { services as allServices, stylists, timeSlots, mapApiSalonToFrontendSalon, type Salon } from '../data';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useNotifications } from '../context/NotificationContext';
import { createAppointment, fetchSalonById } from '../lib/api';
import SalonMap from '../components/SalonMap';
import './Booking.css';

const steps = ['Select Service', 'Choose Stylist', 'Date & Time', 'Your Details', 'Payment'];

// Payment method options
type PaymentMethod = 'momo' | 'orange' | 'card' | 'cash' | '';

interface PaymentOption {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: string;
    color: string;
    bg: string;
}

const paymentOptions: PaymentOption[] = [
    {
        id: 'momo',
        label: 'MTN MoMo',
        description: 'Pay with MTN Mobile Money',
        icon: '📱',
        color: '#1a1a1a',
        bg: '#FFD700',
    },
    {
        id: 'orange',
        label: 'Orange Money',
        description: 'Pay with Orange Money',
        icon: '🟠',
        color: '#fff',
        bg: '#FF6600',
    },
    {
        id: 'card',
        label: 'Card',
        description: 'Credit or Debit Card',
        icon: '💳',
        color: '#fff',
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
        id: 'cash',
        label: 'Cash',
        description: 'Pay in person at the salon',
        icon: '💵',
        color: '#fff',
        bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
];

export default function Booking() {
    const [searchParams] = useSearchParams();
    const salonId = searchParams.get('salon');
    const preselectedService = searchParams.get('service') || '';
    
    const [salon, setSalon] = useState<Salon | null>(null);
    const [isLoadingSalon, setIsLoadingSalon] = useState(true);

    const { showToast } = useToast();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [step, setStep] = useState(preselectedService ? 1 : 0);
    const [selectedService, setSelectedService] = useState(preselectedService);
    const [selectedStylist, setSelectedStylist] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
    const [momoPhone, setMomoPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');

    useEffect(() => {
        const loadSalon = async () => {
            if (!salonId) {
                setIsLoadingSalon(false);
                return;
            }
            try {
                const data = await fetchSalonById(salonId);
                setSalon(mapApiSalonToFrontendSalon(data));
            } catch (err) {
                console.error("Failed to fetch salon:", err);
            } finally {
                setIsLoadingSalon(false);
            }
        };
        loadSalon();
    }, [salonId]);

    const availableServices = salon?.services.length ? salon.services : allServices.slice(0, 4);

    // Real-time slot availability: block slots already booked for this salon on the selected date
    const bookedSlots = useMemo(() => {
        if (!salon) return [];
        try {
            const all = JSON.parse(localStorage.getItem('salon_bookings') || '[]');
            return all
                .filter((b: { salonId: string; date: string; status?: string }) =>
                    b.salonId === salon.id &&
                    b.date === selectedDate &&
                    b.status !== 'cancelled'
                )
                .map((b: { time: string }) => b.time);
        } catch { return []; }
    }, [salon, selectedDate]);

    const handleNext = () => {
        if (step === 0 && !selectedService) {
            showToast('Please select a service to continue.', 'error');
            return;
        }
        if (step === 2 && !selectedDate) {
            showToast('Please select a date.', 'error');
            return;
        }
        if (step === 2 && !selectedTime) {
            showToast('Please select a time slot.', 'error');
            return;
        }
        if (step === 3) {
            if (!name.trim()) {
                showToast('Please enter your full name.', 'error');
                return;
            }
            if (!email.trim()) {
                showToast('Please enter your email address.', 'error');
                return;
            }
        }
        if (step < steps.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const formatCardNumber = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    const handleConfirm = async () => {
        if (!paymentMethod) {
            showToast('Please select a payment method.', 'error');
            return;
        }
        if ((paymentMethod === 'momo' || paymentMethod === 'orange') && !momoPhone.trim()) {
            showToast(`Please enter your ${paymentMethod === 'momo' ? 'MTN MoMo' : 'Orange Money'} phone number.`, 'error');
            return;
        }
        if (paymentMethod === 'card') {
            if (cardNumber.replace(/\s/g, '').length < 16) {
                showToast('Please enter a valid 16-digit card number.', 'error');
                return;
            }
            if (!cardExpiry || cardExpiry.length < 5) {
                showToast('Please enter a valid expiry date (MM/YY).', 'error');
                return;
            }
            if (cardCvv.length < 3) {
                showToast('Please enter a valid CVV.', 'error');
                return;
            }
            if (!cardName.trim()) {
                showToast('Please enter the name on the card.', 'error');
                return;
            }
        }

        const availableStylists = salon?.stylists || stylists;
        const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

        setIsSubmitting(true);
        try {
            // Parse time string (e.g. "10:00 AM")
            const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            let hours = 9;
            let minutes = 0;
            if (timeParts) {
                hours = parseInt(timeParts[1], 10);
                minutes = parseInt(timeParts[2], 10);
                const period = timeParts[3].toUpperCase();
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }
            
            const combinedDate = new Date(`${selectedDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
            
            const token = await getAccessTokenSilently();
            if (!salon) throw new Error("No salon loaded");
            await createAppointment({
                salonId: salon.id,
                serviceId: selectedService,
                stylistId: bookedStylist?.id,
                date: combinedDate.toISOString(),
                notes: `Stylist: ${bookedStylist?.name || 'Any'}, Payment: ${paymentMethod}`,
            }, token);

            showToast('Booking confirmed! 🎉', 'success');
            addNotification(
                `Booking confirmed at ${salon.name} on ${selectedDate} at ${selectedTime}.`,
                'success'
            );
            setConfirmed(true);
        } catch (error) {
            console.error('Booking failed:', error);
            showToast('Failed to book appointment. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const paymentLabel = paymentOptions.find((p) => p.id === paymentMethod)?.label || '';

    if (confirmed) {
        const bookedService = availableServices.find((s) => s.id === selectedService);
        return (
            <main className="booking-page">
                <div className="container section booking-success">
                    <div className="success-icon">✓</div>
                    <h2>Booking Confirmed!</h2>
                    <p>Your appointment has been successfully booked.</p>
                    <div className="success-details">
                        <p><strong>Salon:</strong> {salon?.name}</p>
                        <p><strong>Service:</strong> {bookedService?.name || 'N/A'}</p>
                        <p><strong>Date:</strong> {selectedDate || 'Not specified'}</p>
                        <p><strong>Time:</strong> {selectedTime || 'Not specified'}</p>
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Payment:</strong> {paymentLabel}</p>
                    </div>

                    {/* Salon location map on success */}
                    <div className="success-map">
                        <h4>Salon Location</h4>
                        <SalonMap
                            name={salon?.name || ''}
                            address={salon?.address || ''}
                            coordinates={salon?.coordinates || { lat: 0, lng: 0 }}
                            height={200}
                        />
                    </div>

                    <Link to="/" className="btn btn-primary">
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    if (isLoadingSalon) {
        return (
            <main className="booking-page">
                <div className="container section" style={{ textAlign: 'center' }}>
                    <h2>Loading salon details...</h2>
                </div>
            </main>
        );
    }

    if (!salon) {
        return (
            <main className="booking-page">
                <div className="container section" style={{ textAlign: 'center' }}>
                    <h2>Salon Not Found</h2>
                    <p>We couldn't find the salon you're trying to book.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return Home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="booking-page">
            <section className="booking-header">
                <div className="container">
                    <h1>Book an Appointment</h1>
                    <p>at <strong>{salon.name}</strong></p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {/* Steps Indicator */}
                    <div className="steps-indicator">
                        {steps.map((s, i) => (
                            <div
                                key={s}
                                className={`step-item ${i <= step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            >
                                <div className="step-number">{i < step ? '✓' : i + 1}</div>
                                <span className="step-label">{s}</span>
                            </div>
                        ))}
                    </div>

                    <div className="booking-content">
                        {/* Step 0: Select Service */}
                        {step === 0 && (
                            <div className="booking-step animate-fade-up">
                                <h3>Choose a Service</h3>
                                <div className="booking-options">
                                    {availableServices.map((s) => (
                                        <div
                                            key={s.id}
                                            className={`booking-option ${selectedService === s.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedService(s.id)}
                                        >
                                            <div>
                                                <h4>{s.name}</h4>
                                                <p>{s.duration} • {s.category}</p>
                                            </div>
                                            <span className="option-price">${s.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Choose Stylist */}
                        {step === 1 && (
                            <div className="booking-step animate-fade-up">
                                <h3>Choose Your Stylist</h3>
                                <div className="booking-stylists">
                                    {(salon?.stylists || stylists).map((st) => (
                                        <div
                                            key={st.id}
                                            className={`stylist-option ${selectedStylist === st.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedStylist(st.id)}
                                        >
                                            <div className="stylist-avatar">{st.name.charAt(0)}</div>
                                            <h4>{st.name}</h4>
                                            <p>{st.role}</p>
                                            <span className="stylist-rating-small">★ {st.rating}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Date & Time */}
                        {step === 2 && (
                            <div className="booking-step animate-fade-up">
                                <h3>Pick Date & Time</h3>
                                <div className="date-time-grid">
                                    <div className="date-picker">
                                        <label>Select Date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="date-input"
                                        />
                                    </div>
                                    <div className="time-picker">
                                        <label>Select Time</label>
                                        <div className="time-grid">
                                {timeSlots.map((slot) => {
                                                const isBooked = bookedSlots.includes(slot.time);
                                                return (
                                                    <button
                                                        key={slot.time}
                                                        className={`time-slot ${(!slot.available || isBooked) ? 'disabled' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
                                                        disabled={!slot.available || isBooked}
                                                        onClick={() => setSelectedTime(slot.time)}
                                                        title={isBooked ? 'Already booked' : undefined}
                                                    >
                                                        {slot.time}
                                                        {isBooked && <span className="slot-booked-dot" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Your Details */}
                        {step === 3 && (
                            <div className="booking-step animate-fade-up">
                                <h3>Your Details</h3>
                                <div className="confirm-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="booking-summary">
                                        <h4>Booking Summary</h4>
                                        <div className="summary-row">
                                            <span>Salon</span>
                                            <span>{salon.name}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Service</span>
                                            <span>{availableServices.find((s) => s.id === selectedService)?.name || '—'}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Stylist</span>
                                            <span>{stylists.find((st) => st.id === selectedStylist)?.name || 'Any available'}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Date</span>
                                            <span>{selectedDate || '—'}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Time</span>
                                            <span>{selectedTime || '—'}</span>
                                        </div>
                                        <div className="summary-row total">
                                            <span>Total</span>
                                            <span>${availableServices.find((s) => s.id === selectedService)?.price || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Payment */}
                        {step === 4 && (
                            <div className="booking-step animate-fade-up">
                                <h3>Choose Payment Method</h3>
                                <p className="payment-subtitle">
                                    Total: <strong className="payment-total-amount">
                                        ${availableServices.find((s) => s.id === selectedService)?.price || 0}
                                    </strong>
                                </p>

                                {/* Payment method cards */}
                                <div className="payment-methods-grid">
                                    {paymentOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            className={`payment-method-card ${paymentMethod === opt.id ? 'selected' : ''}`}
                                            onClick={() => setPaymentMethod(opt.id)}
                                        >
                                            <div
                                                className="payment-method-icon"
                                                style={{ background: opt.bg, color: opt.color }}
                                            >
                                                <span>{opt.icon}</span>
                                            </div>
                                            <div className="payment-method-info">
                                                <span className="payment-method-name">{opt.label}</span>
                                                <span className="payment-method-desc">{opt.description}</span>
                                            </div>
                                            <div className={`payment-radio ${paymentMethod === opt.id ? 'checked' : ''}`} />
                                        </button>
                                    ))}
                                </div>

                                {/* MoMo / Orange Money phone field */}
                                {(paymentMethod === 'momo' || paymentMethod === 'orange') && (
                                    <div className="payment-details-form animate-fade-up">
                                        <div className="payment-method-header" style={{
                                            background: paymentMethod === 'momo' ? '#FFD700' : '#FF6600',
                                            color: paymentMethod === 'momo' ? '#1a1a1a' : '#fff',
                                        }}>
                                            <span>{paymentMethod === 'momo' ? '📱 MTN Mobile Money' : '🟠 Orange Money'}</span>
                                        </div>
                                        <div className="form-group">
                                            <label>{paymentMethod === 'momo' ? 'MTN MoMo' : 'Orange'} Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder={paymentMethod === 'momo' ? 'e.g. 023 000 0000' : 'e.g. 050 000 0000'}
                                                value={momoPhone}
                                                onChange={(e) => setMomoPhone(e.target.value)}
                                            />
                                        </div>
                                        <p className="payment-info-note">
                                            💡 You will receive a prompt on your phone to authorize the payment of
                                            <strong> ${availableServices.find((s) => s.id === selectedService)?.price || 0}</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* Card payment fields */}
                                {paymentMethod === 'card' && (
                                    <div className="payment-details-form animate-fade-up">
                                        <div className="payment-method-header" style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: '#fff',
                                        }}>
                                            <span>💳 Credit / Debit Card</span>
                                        </div>
                                        <div className="form-group">
                                            <label>Card Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                maxLength={19}
                                                inputMode="numeric"
                                            />
                                        </div>
                                        <div className="card-row">
                                            <div className="form-group">
                                                <label>Expiry Date</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="MM/YY"
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                                    maxLength={5}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>CVV</label>
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    placeholder="•••"
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    maxLength={4}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Name on Card</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Full name as on card"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value)}
                                            />
                                        </div>
                                        <p className="payment-info-note payment-mock-note">
                                            🔒 This is a demo. No real payment will be processed.
                                        </p>
                                    </div>
                                )}

                                {/* Cash on arrival */}
                                {paymentMethod === 'cash' && (
                                    <div className="payment-details-form animate-fade-up">
                                        <div className="payment-method-header" style={{
                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                            color: '#fff',
                                        }}>
                                            <span>💵 Cash on Arrival</span>
                                        </div>
                                        <div className="cash-info">
                                            <p>Please bring <strong>${availableServices.find((s) => s.id === selectedService)?.price || 0}</strong> in cash to your appointment.</p>
                                            <p>📍 <em>{salon.address}</em></p>
                                            <p>⏰ Your appointment is at <strong>{selectedTime}</strong> on <strong>{selectedDate}</strong>.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="booking-nav">
                            {step > 0 && (
                                <button className="btn btn-outline" onClick={handleBack}>
                                    ← Back
                                </button>
                            )}
                            {step < steps.length - 1 ? (
                                <button className="btn btn-primary" onClick={handleNext}>
                                    Continue →
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
