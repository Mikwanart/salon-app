import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { services as allServices, stylists, timeSlots, mapApiSalonToFrontendSalon, type Salon } from '../data';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useNotifications } from '../context/NotificationContext';
import { createAppointment, fetchSalonById, verifyPaymentStatus, fetchBookedSlots } from '../lib/api';

import SalonMap from '../components/SalonMap';
import { CheckCircle, Smartphone, CreditCard, Lock, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import './Booking.css';

const steps = ['Select Service', 'Choose Stylist', 'Date & Time', 'Your Details', 'Payment'];

// Payment method options
type PaymentMethod = 'momo' | 'card' | 'cash' | '';

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

    // Payment Simulation State
    const [paymentSimulationStep, setPaymentSimulationStep] = useState<'none' | 'momo-prompt' | 'card-otp' | 'processing' | 'success'>('none');
    const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '', '', '']);
    const [otpSentCode, setOtpSentCode] = useState<string>('');
    const [otpShowSms, setOtpShowSms] = useState<boolean>(false);
    const [otpError, setOtpError] = useState<string>('');
    const [transactionDetails, setTransactionDetails] = useState<any>(null);

    // Refs for OTP input navigation
    const otpRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    // Real MTN MoMo Polling and Countdown States
    const [momoCountdown, setMomoCountdown] = useState<number>(120);
    const pollIntervalRef = useRef<any>(null);
    const countdownIntervalRef = useRef<any>(null);

    const cleanIntervals = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    };

    const startMomoPolling = (appointmentId: string, token: string) => {
        let attempts = 0;
        const maxAttempts = 40; // 40 attempts * 3s = 120s

        // 1. Polling interval
        pollIntervalRef.current = setInterval(async () => {
            attempts += 1;

            if (attempts > maxAttempts) {
                cleanIntervals();
                setPaymentSimulationStep('none');
                showToast('MoMo payment request timed out. Please try again.', 'error');
                return;
            }

            try {
                const statusResult = await verifyPaymentStatus(appointmentId, token);

                if (statusResult.paymentStatus === 'PAID') {
                    cleanIntervals();

                    const bookedService = availableServices.find((s) => s.id === selectedService);
                    const availableStylists = salon?.stylists || stylists;
                    const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

                    setTransactionDetails({
                        id: appointmentId,
                        transactionId: statusResult.transactionId || 'MOMO-PAY',
                        paymentMethod: 'momo',
                        paymentStatus: 'PAID',
                        paymentDetails: `MoMo Phone: ${momoPhone.trim()}`,
                        price: bookedService?.price || 0,
                        serviceName: bookedService?.name || 'Service',
                        date: selectedDate,
                        time: selectedTime,
                        stylistName: bookedStylist?.name || 'Any Stylist',
                    });

                    setPaymentSimulationStep('success');
                    setTimeout(() => {
                        showToast('Booking confirmed! 🎉', 'success');
                        addNotification(
                            `Booking confirmed at ${salon?.name} on ${selectedDate} at ${selectedTime}.`,
                            'success'
                        );
                        setConfirmed(true);
                        setPaymentSimulationStep('none');
                    }, 1500);
                } else if (statusResult.paymentStatus === 'FAILED') {
                    cleanIntervals();
                    setPaymentSimulationStep('none');
                    showToast('Payment request was rejected or failed on your phone.', 'error');
                }
            } catch (err) {
                console.error('Error polling MoMo payment status:', err);
            }
        }, 3000);

        // 2. Visual countdown interval
        setMomoCountdown(120);
        countdownIntervalRef.current = setInterval(() => {
            setMomoCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const initiateMomoPayment = async () => {
        setIsSubmitting(true);
        const phoneForMomo = momoPhone.trim();

        // Extract stylist
        const availableStylists = salon?.stylists || stylists;
        const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

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

            const bookingData = {
                salonId: salon.id,
                serviceId: selectedService,
                stylistId: bookedStylist?.id,
                date: combinedDate.toISOString(),
                notes: `Stylist: ${bookedStylist?.name || 'Any'}, MTN MoMo Payment pending authorization. Phone: ${phoneForMomo}`,
                paymentMethod: 'MOMO',
                paymentStatus: 'PENDING',
                paymentDetails: phoneForMomo,
            };

            // Call backend: triggers requestToPay and returns pending transaction record
            const result = await createAppointment(bookingData, token);

            // Open the status polling view
            setPaymentSimulationStep('momo-prompt');
            startMomoPolling(result.id, token);

        } catch (error: any) {
            console.error('MoMo payment initiation failed:', error);
            showToast(error.message || 'Failed to initiate MoMo charge. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    // Real-time slot availability: fetch booked slots from the DB for the selected salon + date
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    useEffect(() => {
        if (!salon?.id || !selectedDate) {
            setBookedSlots([]);
            return;
        }
        fetchBookedSlots(salon.id, selectedDate)
            .then(setBookedSlots)
            .catch(() => setBookedSlots([])); // fail silently — don't block booking
    }, [salon?.id, selectedDate]);

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

    // Helper to perform actual backend appointment creation
    const executeFinalBooking = async (paymentInfo: { method: string; status: string; details: string }) => {
        setIsSubmitting(true);
        setPaymentSimulationStep('processing');

        // Extract stylist
        const availableStylists = salon?.stylists || stylists;
        const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

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

            const txnId = paymentInfo.method !== 'CASH' 
                ? `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}` 
                : null;

            const bookingData = {
                salonId: salon.id,
                serviceId: selectedService,
                stylistId: bookedStylist?.id,
                date: combinedDate.toISOString(),
                notes: `Stylist: ${bookedStylist?.name || 'Any'}, Payment Method: ${paymentInfo.method}, Details: ${paymentInfo.details}${phone.trim() ? `, Phone: ${phone.trim()}` : ''}`,
                paymentMethod: paymentInfo.method,
                paymentStatus: paymentInfo.status,
                paymentDetails: paymentInfo.details,
                transactionId: txnId || undefined,
            };

            const result = await createAppointment(bookingData, token);

            // Save details for the receipt
            const bookedService = availableServices.find((s) => s.id === selectedService);
            setTransactionDetails({
                id: result.id,
                transactionId: txnId,
                paymentMethod: paymentInfo.method,
                paymentStatus: paymentInfo.status,
                paymentDetails: paymentInfo.details,
                price: bookedService?.price || 0,
                serviceName: bookedService?.name || 'Service',
                date: selectedDate,
                time: selectedTime,
                stylistName: bookedStylist?.name || 'Any Stylist',
            });

            // Transition to success screen
            setPaymentSimulationStep('success');
            setTimeout(() => {
                showToast('Booking confirmed! 🎉', 'success');
                addNotification(
                    `Booking confirmed at ${salon.name} on ${selectedDate} at ${selectedTime}.`,
                    'success'
                );
                setConfirmed(true);
                setPaymentSimulationStep('none');
            }, 1500);

        } catch (error) {
            console.error('Booking failed:', error);
            showToast('Failed to book appointment. Please try again.', 'error');
            setPaymentSimulationStep('none');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!paymentMethod) {
            showToast('Please select a payment method.', 'error');
            return;
        }
        if (paymentMethod === 'momo' && !momoPhone.trim()) {
            showToast(`Please enter your MTN MoMo phone number.`, 'error');
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

        // Cash requires no simulation, directly complete
        if (paymentMethod === 'cash') {
            await executeFinalBooking({
                method: 'CASH',
                status: 'PENDING',
                details: 'Pay at Salon'
            });
            return;
        }

        // MoMo initiates the payment charge prompt immediately
        if (paymentMethod === 'momo') {
            await initiateMomoPayment();
            return;
        }

        // Card opens the 3D-Secure Bank SMS OTP simulator
        if (paymentMethod === 'card') {
            const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setOtpSentCode(randomOtp);
            setOtpInput(['', '', '', '', '', '']);
            setOtpError('');
            setPaymentSimulationStep('card-otp');
            
            // Show the simulated SMS notification slider after 1s
            setTimeout(() => {
                setOtpShowSms(true);
            }, 1000);
            return;
        }
    };

    // Card OTP changes
    const handleOtpChange = (index: number, val: string) => {
        const cleaned = val.replace(/\D/g, '');
        if (!cleaned) return;

        const nextInput = [...otpInput];
        nextInput[index] = cleaned.slice(-1);
        setOtpInput(nextInput);

        // Move to next box
        if (index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const nextInput = [...otpInput];
            if (nextInput[index]) {
                nextInput[index] = '';
                setOtpInput(nextInput);
            } else if (index > 0) {
                nextInput[index - 1] = '';
                setOtpInput(nextInput);
                otpRefs[index - 1].current?.focus();
            }
        }
    };

    const handleOtpVerify = async () => {
        const code = otpInput.join('');
        if (code.length < 6) {
            setOtpError('Please enter the full 6-digit OTP code.');
            return;
        }
        if (code !== otpSentCode) {
            setOtpError('Incorrect OTP code. Please try again.');
            return;
        }
        // Correct OTP! Process final booking
        setOtpShowSms(false);
        await executeFinalBooking({
            method: 'CARD',
            status: 'PAID',
            details: `Card ending in ${cardNumber.replace(/\s/g, '').slice(-4)}`
        });
    };

    if (confirmed) {
        const bookedService = availableServices.find((s) => s.id === selectedService);
        const receiptId = transactionDetails?.id?.slice(0, 8) || 'N/A';
        const formattedPrice = transactionDetails?.price || bookedService?.price || 0;
        
        return (
            <main className="booking-page">
                <div className="container section booking-success animate-fade-up">
                    <div className="success-icon">✓</div>
                    <h2>Booking Confirmed!</h2>
                    <p>Your appointment has been successfully booked.</p>
                    
                    {/* Beautiful Invoice Card */}
                    <div className="invoice-card">
                        <div className="invoice-header">
                            <div>
                                <span className="invoice-logo">✨ Lumière Salon</span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Luxury Styling & Care</p>
                            </div>
                            <div className="invoice-meta">
                                <p><strong>Receipt #:</strong> {receiptId.toUpperCase()}</p>
                                <p><strong>Ref:</strong> {transactionDetails?.transactionId || 'CASH-PAY'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Salon</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{salon?.name}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Stylist</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{transactionDetails?.stylistName || 'Any Stylist'}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Date & Time</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{transactionDetails?.date} at {transactionDetails?.time}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Service booked</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{transactionDetails?.serviceName}</strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                                {transactionDetails?.paymentMethod === 'momo' ? 'MTN MoMo' : 
                                 transactionDetails?.paymentMethod === 'card' ? 'Credit Card' : 
                                 transactionDetails?.paymentMethod === 'cash' ? 'Pay at Salon (Cash)' : 'Unknown'}
                            </strong>
                        </div>
                        <div className="invoice-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Payment Status</span>
                            <span>
                                <span className={`badge-status ${transactionDetails?.paymentStatus?.toLowerCase()}`}>
                                    {transactionDetails?.paymentStatus || 'PENDING'}
                                </span>
                            </span>
                        </div>
                        
                        <div className="invoice-row invoice-total">
                            <span>Amount Charged</span>
                            <span>${formattedPrice}</span>
                        </div>
                    </div>

                    <div className="invoice-actions">
                        <button className="btn btn-secondary" onClick={() => window.print()}>
                            <Printer size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Print Receipt
                        </button>
                        <Link to="/" className="btn btn-primary">
                            Back to Home
                        </Link>
                    </div>

                    {/* Salon location map on success */}
                    <div className="success-map" style={{ marginTop: '30px' }}>
                        <h4>Salon Location</h4>
                        <SalonMap
                            name={salon?.name || ''}
                            address={salon?.address || ''}
                            coordinates={salon?.coordinates || { lat: 0, lng: 0 }}
                            height={200}
                        />
                    </div>
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

                                {/* MoMo phone field */}
                                {paymentMethod === 'momo' && (
                                    <div className="payment-details-form animate-fade-up">
                                        <div className="payment-method-header" style={{
                                            background: '#FFD700',
                                            color: '#1a1a1a',
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Smartphone size={18} /> MTN Mobile Money</span>
                                        </div>
                                        <div className="form-group">
                                            <label>MTN MoMo Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="e.g. 024 000 0000"
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
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><CreditCard size={18} /> Credit / Debit Card</span>
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
                                        <p className="payment-info-note payment-mock-note" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Lock size={14} /> This is a demo. No real payment will be processed.
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

            {/* ── Simulated Payment overlays ──────────────── */}
            {paymentSimulationStep !== 'none' && (
                <div className="payment-overlay">
                    
                    {/* Simulated SMS banner for Card OTP */}
                    {paymentSimulationStep === 'card-otp' && otpShowSms && (
                        <div className="sms-toast-container">
                            <div className="sms-toast">
                                <span className="sms-icon">💬</span>
                                <div className="sms-content">
                                    <span className="sms-sender">Security Bank SMS</span>
                                    <p className="sms-body">
                                        Your SalonApp verification OTP code is <strong>{otpSentCode}</strong>. Do not share this code.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MoMo Simulator Prompt Box */}
                    {paymentSimulationStep === 'momo-prompt' && (
                        <div className="phone-mockup">
                            <div className="phone-notch" />
                            <div className="phone-screen animate-fade-up">
                                <div className="phone-header">
                                    <span>MTN GH</span>
                                    <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                                    <span>📶 🔋</span>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
                                    <div className="momo-brand">
                                        <Smartphone size={18} /> MTN Mobile Money
                                    </div>
                                    
                                    <div className="momo-prompt-box" style={{ textAlign: 'center' }}>
                                        <div className="spinner-ring" style={{ width: '40px', height: '40px', borderWidth: '3px', margin: '0 auto 16px' }} />
                                        
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Authorize Payment</h4>
                                        <p style={{ fontSize: '0.78rem', color: '#555', lineHeight: '1.4' }}>
                                            We sent a push prompt to your phone:
                                        </p>
                                        <strong style={{ fontSize: '0.9rem', color: '#111', display: 'block', margin: '4px 0 10px' }}>
                                            {momoPhone}
                                        </strong>
                                        
                                        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '16px', lineHeight: '1.4' }}>
                                            Please check your phone, enter your PIN, and approve the charge of 
                                            <strong> ${availableServices.find((s) => s.id === selectedService)?.price || 0}</strong>.
                                        </p>

                                        <div style={{ background: 'var(--primary-light)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                                            <RefreshCw size={12} className="animate-spin" />
                                            Waiting for approval ({momoCountdown}s)
                                        </div>

                                        <button 
                                            type="button" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '10px', 
                                                fontSize: '0.85rem', 
                                                border: '1px solid var(--border)', 
                                                borderRadius: '8px', 
                                                background: 'var(--surface)', 
                                                fontWeight: 600, 
                                                cursor: 'pointer',
                                                color: '#ef4444' 
                                            }} 
                                            onClick={() => {
                                                cleanIntervals();
                                                setPaymentSimulationStep('none');
                                            }}
                                        >
                                            Cancel Transaction
                                        </button>
                                    </div>
                                </div>
                                <div style={{ height: '12px' }} />
                            </div>
                        </div>
                    )}

                    {/* Card 3D Secure Verification Simulator */}
                    {paymentSimulationStep === 'card-otp' && (
                        <div className="payment-modal">
                            <div className="bank-logo">🛡️ SecurityBank</div>
                            <span className="badge-status paid" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>Verified by VISA / MasterCard</span>
                            
                            <h3 style={{ marginTop: '20px', marginBottom: '8px' }}>One-Time Password (OTP)</h3>
                            <p className="bank-subtitle">
                                We sent a 6-digit verification code to the phone number linked to Card **** **** **** {cardNumber.replace(/\s/g, '').slice(-4)}.
                            </p>

                            <div className="otp-input-container">
                                {otpInput.map((val, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-box-${idx}`}
                                        ref={otpRefs[idx]}
                                        type="text"
                                        maxLength={1}
                                        className="otp-box"
                                        value={val}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        autoFocus={idx === 0}
                                        inputMode="numeric"
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={16} /> {otpError}
                                </p>
                            )}

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                                Code not received? <span style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                                    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
                                    setOtpSentCode(randomOtp);
                                    setOtpShowSms(true);
                                    setOtpError('');
                                }}><RefreshCw size={12} /> Resend Code</span>
                            </p>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                    setOtpShowSms(false);
                                    setPaymentSimulationStep('none');
                                }}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOtpVerify}>
                                    Verify
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Processing State */}
                    {paymentSimulationStep === 'processing' && (
                        <div className="payment-modal">
                            <div className="payment-processing-content">
                                <div className="spinner-ring" />
                                <h3>Authorizing Payment...</h3>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
                                    Verifying transaction with your payment processor. Please do not close this window.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success checkmark State */}
                    {paymentSimulationStep === 'success' && (
                        <div className="payment-modal" style={{ padding: '40px 32px' }}>
                            <div className="payment-processing-content">
                                <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '16px', animation: 'scaleUp 0.3s ease' }} />
                                <h3 style={{ color: '#10b981' }}>Payment Approved!</h3>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
                                    Your booking has been secured. Loading receipt...
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </main>
    );
}
