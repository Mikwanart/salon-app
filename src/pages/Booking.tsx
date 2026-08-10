import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { services as allServices, stylists, timeSlots, mapApiSalonToFrontendSalon, salons as fallbackSalons, type Salon } from '../data';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useNotifications } from '../context/NotificationContext';
import { createAppointment, fetchSalonById, fetchSalons, verifyPaymentStatus, fetchBookedSlots } from '../lib/api';

import { RefreshCw, Printer, Smartphone, Store, Star, ExternalLink } from 'lucide-react';
import './Booking.css';

// Import new step components
import BookingServiceStep from './booking/BookingServiceStep';
import BookingStylistStep from './booking/BookingStylistStep';
import BookingTimeStep from './booking/BookingTimeStep';
import BookingReviewStep from './booking/BookingReviewStep';
import BookingPaymentStep from './booking/BookingPaymentStep';

const steps = ['Service', 'Stylist', 'Time', 'Review', 'Payment'];

export default function Booking() {
    const [searchParams] = useSearchParams();
    const salonId = searchParams.get('salon');
    const preselectedService = searchParams.get('service') || '';
    
    const [salon, setSalon] = useState<Salon | null>(null);
    const [isLoadingSalon, setIsLoadingSalon] = useState(true);

    const { showToast } = useToast();
    const { user } = useAuth();
    const { addNotification, addNotificationForUser } = useNotifications();
    
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

    // Payment Simulation State
    const [paymentSimulationStep, setPaymentSimulationStep] = useState<'none' | 'momo-prompt' | 'card-otp' | 'processing' | 'success'>('none');
    const [transactionDetails, setTransactionDetails] = useState<any>(null);

    // Real MTN MoMo Polling and Countdown States
    const [momoCountdown, setMomoCountdown] = useState<number>(120);
    const [momoPhone, setMomoPhone] = useState(''); // Used for MoMo prompt UI
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
                        addNotification(`Booking confirmed at ${salon?.name} on ${selectedDate} at ${selectedTime}.`, 'success');
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

    const initiateMomoPayment = async (phoneForMomo: string) => {
        setIsSubmitting(true);
        setMomoPhone(phoneForMomo);
        const availableStylists = salon?.stylists || stylists;
        const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

        try {
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

            const result = await createAppointment(bookingData, token);

            if (result.paystackAuthorizationUrl) {
                window.open(result.paystackAuthorizationUrl, '_blank', 'noopener,noreferrer');
            }

            setPaymentSimulationStep('momo-prompt');
            startMomoPolling(result.id, token);

        } catch (error: any) {
            console.error('MoMo payment initiation failed:', error);
            showToast(error.message || 'Failed to initiate MoMo charge. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to perform actual backend appointment creation
    const executeFinalBooking = async (paymentInfo: { method: string; status: string; details: string }) => {
        setIsSubmitting(true);
        setPaymentSimulationStep('processing');

        const availableStylists = salon?.stylists || stylists;
        const bookedStylist = availableStylists.find((st) => st.id === selectedStylist);

        try {
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

            setPaymentSimulationStep('success');
            setTimeout(() => {
                showToast('Booking submitted! Pending salon approval. ⏳', 'success');
                addNotification(
                    `Your booking for ${bookedService?.name || 'service'} at ${salon.name} on ${selectedDate} at ${selectedTime} was submitted and is pending salon approval.`,
                    'info',
                    { appointmentId: result.id, status: 'PENDING', salonName: salon.name }
                );
                const ownerEmail = (salon as any)?.owner?.email || (salon as any)?.email || 'mikenart7@gmail.com';
                addNotificationForUser(ownerEmail, {
                    message: `🔔 New booking request from ${name} for ${bookedService?.name || 'Service'} on ${selectedDate} at ${selectedTime}.`,
                    type: 'warning',
                    appointmentId: result.id,
                    status: 'PENDING',
                    salonName: salon.name,
                    actions: ['accept', 'decline']
                });

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

    const handlePay = (method: 'momo' | 'card' | 'cash', details: any) => {
        if (method === 'cash') {
            executeFinalBooking({
                method: 'CASH',
                status: 'PENDING',
                details: 'Pay at Salon'
            });
        } else if (method === 'momo') {
            const phoneNumber = details.phone || '024 000 0000'; // Prompt for real number in a prod app
            initiateMomoPayment(phoneNumber);
        } else if (method === 'card') {
            // Simplified card handling for mockup
            executeFinalBooking({
                method: 'CARD',
                status: 'PAID',
                details: 'Card ending in 1234'
            });
        }
    };

    useEffect(() => {
        const loadSalonData = async () => {
            setIsLoadingSalon(true);
            try {
                let mappedSalons: Salon[] = [];
                try {
                    const apiSalonsData = await fetchSalons();
                    if (Array.isArray(apiSalonsData) && apiSalonsData.length > 0) {
                        mappedSalons = apiSalonsData.map((s: any) => mapApiSalonToFrontendSalon(s, null));
                    } else {
                        mappedSalons = fallbackSalons;
                    }
                } catch {
                    mappedSalons = fallbackSalons;
                }

                if (salonId) {
                    const data = await fetchSalonById(salonId);
                    setSalon(mapApiSalonToFrontendSalon(data));
                } else if (mappedSalons.length > 0) {
                    let targetSalon = mappedSalons[0];
                    if (preselectedService) {
                        const preselectedLower = preselectedService.toLowerCase();
                        const found = mappedSalons.find(sl =>
                            sl.services.some(sv =>
                                sv.id === preselectedService ||
                                sv.name.toLowerCase() === preselectedLower
                            )
                        );
                        if (found) targetSalon = found;
                    }
                    setSalon(targetSalon);
                }
            } catch (err) {
                console.error("Failed to fetch salon details:", err);
                if (fallbackSalons.length > 0) {
                    setSalon(fallbackSalons[0]);
                }
            } finally {
                setIsLoadingSalon(false);
            }
        };
        loadSalonData();
    }, [salonId, preselectedService]);

    const availableServices = salon?.services.length ? salon.services : allServices.slice(0, 4);

    useEffect(() => {
        if (!salon) return;
        const available = salon.services.length ? salon.services : allServices.slice(0, 4);

        if (preselectedService) {
            const preselectedLower = preselectedService.toLowerCase();
            const matched = available.find(
                (s) => s.id === preselectedService || s.name.toLowerCase() === preselectedLower
            );
            if (matched) {
                setSelectedService(matched.id);
                return;
            }
        }

        if (selectedService) {
            const matched = available.find(
                (s) => s.id === selectedService || s.name.toLowerCase() === selectedService.toLowerCase()
            );
            if (matched) {
                setSelectedService(matched.id);
                return;
            }
        }

        if (available.length > 0) {
            setSelectedService(available[0].id);
        }
    }, [salon, preselectedService]);

    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    useEffect(() => {
        if (!salon?.id || !selectedDate) {
            setBookedSlots([]);
            return;
        }
        fetchBookedSlots(salon.id, selectedDate)
            .then(setBookedSlots)
            .catch(() => setBookedSlots([]));
    }, [salon?.id, selectedDate]);

    const handleNext = () => {
        if (step === 0 && !selectedService) {
            showToast('Please select a service to continue.', 'error');
            return;
        }
        if (step === 1 && !selectedStylist) {
            showToast('Please select a stylist.', 'error');
            return;
        }
        if (step === 2 && (!selectedDate || !selectedTime)) {
            showToast('Please select a date and time.', 'error');
            return;
        }
        if (step === 3) {
            if (!name.trim()) setName(user?.name || 'Guest Client');
            if (!email.trim()) setEmail(user?.email || 'client@example.com');
            if (!phone.trim()) setPhone('024 000 0000');
        }
        if (step < steps.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    if (confirmed) {
        const bookedService = availableServices.find((s) => s.id === selectedService);
        const receiptId = transactionDetails?.id?.slice(0, 8) || 'N/A';
        const formattedPrice = transactionDetails?.price || bookedService?.price || 0;
        
        return (
            <main className="booking-page">
                <div className="container section booking-success animate-fade-up" style={{ padding: '2rem 1rem', maxWidth: '640px', margin: '0 auto' }}>
                    <div className="success-icon" style={{ 
                        width: '72px', height: '72px', borderRadius: '50%', background: '#b10e6b', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '36px', fontWeight: 'bold', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(177, 14, 107, 0.3)'
                    }}>✓</div>
                    
                    <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
                        Booking Confirmed!
                    </h2>
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '0.95rem', marginBottom: '32px' }}>
                        Your appointment has been successfully booked.
                    </p>
                    
                    <div className="invoice-card">
                        <div className="invoice-header">
                            <div>
                                <span className="invoice-logo">✨ {salon?.name}</span>
                                <p className="invoice-sublogo">Luxury Styling & Care</p>
                            </div>
                            <div className="invoice-meta">
                                <p><strong>Receipt #:</strong> {receiptId.toUpperCase()}</p>
                                <p><strong>Ref:</strong> {transactionDetails?.transactionId || 'CASH-PAY'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="invoice-details">
                            <div className="invoice-row">
                                <span className="invoice-label">Customer</span>
                                <span className="invoice-value">{name}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Stylist</span>
                                <span className="invoice-value">{transactionDetails?.stylistName || 'Any Stylist'}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Date & Time</span>
                                <span className="invoice-value">{transactionDetails?.date} at {transactionDetails?.time}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Service</span>
                                <span className="invoice-value">{transactionDetails?.serviceName}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Payment Method</span>
                                <span className="invoice-value">{transactionDetails?.paymentMethod?.toUpperCase()}</span>
                            </div>
                            
                            <div className="invoice-row invoice-total">
                                <span>Total Amount</span>
                                <span className="invoice-total-amount">GH₵{formattedPrice}</span>
                            </div>
                        </div>
                    </div>

                    <div className="invoice-actions">
                        <button type="button" className="confirm-booking-btn" style={{ background: 'transparent', color: '#b10e6b', border: '1px solid #b10e6b', boxShadow: 'none' }} onClick={() => window.print()}>
                            <Printer size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Print Receipt
                        </button>
                        <Link to="/" className="confirm-booking-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (isLoadingSalon) {
        return (
            <main className="booking-page">
                <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Loading salon details...</span>
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

    const availableStylists = salon?.stylists || stylists;
    const bookedServiceDetails = availableServices.find((s) => s.id === selectedService);
    const bookedStylistDetails = availableStylists.find((st) => st.id === selectedStylist);

    return (
        <main className="booking-page">
            <div className="container">
                {/* Top bar with Current Salon Indicator */}
                {salon && (
                    <div className="booking-top-bar">
                        <Link
                            to={`/salon/${salon.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="current-salon-indicator"
                            title={`Click to view details for ${salon.name}`}
                        >
                            <div className="salon-indicator-img">
                                {salon.image ? (
                                    <img src={salon.image} alt={salon.name} />
                                ) : (
                                    <Store size={18} className="salon-indicator-fallback-icon" />
                                )}
                            </div>
                            <div className="salon-indicator-info">
                                <span className="salon-indicator-label">Booking at</span>
                                <span className="salon-indicator-name">{salon.name}</span>
                            </div>
                            {salon.rating > 0 && (
                                <div className="salon-indicator-rating">
                                    <Star size={11} fill="#ffb800" color="#ffb800" />
                                    <span>{salon.rating.toFixed(1)}</span>
                                </div>
                            )}
                            <ExternalLink size={13} className="salon-indicator-link-icon" />
                        </Link>
                    </div>
                )}

                {/* Custom Stepper */}
                <div className="booking-stepper">
                    {steps.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? '0' : '1' }}>
                            <div className="stepper-item">
                                <div className={`stepper-circle ${i === step ? 'active' : i < step ? 'completed' : 'inactive'}`}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className={`stepper-label ${i === step ? 'active' : 'inactive'} hidden md:block`}>{s}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`stepper-line ${i < step ? 'active' : ''}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="booking-content pb-20">
                    {step === 0 && (
                        <BookingServiceStep 
                            availableServices={availableServices} 
                            selectedService={selectedService} 
                            onSelectService={setSelectedService} 
                            onNext={handleNext} 
                        />
                    )}
                    
                    {step === 1 && (
                        <BookingStylistStep 
                            availableStylists={availableStylists}
                            selectedStylist={selectedStylist}
                            onSelectStylist={setSelectedStylist}
                            onNext={handleNext}
                        />
                    )}

                    {step === 2 && (
                        <BookingTimeStep 
                            availableTimeSlots={timeSlots.map(t => t.time)}
                            bookedSlots={bookedSlots}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onSelectDate={setSelectedDate}
                            onSelectTime={setSelectedTime}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}

                    {step === 3 && (
                        <BookingReviewStep 
                            stylistDetails={bookedStylistDetails}
                            serviceDetails={bookedServiceDetails}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            salonName={salon.name}
                            salonAddress={salon.address}
                            customerDetails={{ name, email, phone }}
                            onCustomerDetailsChange={(field, val) => {
                                if (field === 'name') setName(val);
                                if (field === 'email') setEmail(val);
                                if (field === 'phone') setPhone(val);
                            }}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}

                    {step === 4 && (
                        <BookingPaymentStep 
                            serviceDetails={bookedServiceDetails}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            stylistName={bookedStylistDetails?.name || 'Any Stylist'}
                            isSubmitting={isSubmitting}
                            onPay={handlePay}
                            onBack={handleBack}
                        />
                    )}
                </div>
            </div>

            {/* ── Simulated Payment overlays ──────────────── */}
            {paymentSimulationStep !== 'none' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    {paymentSimulationStep === 'momo-prompt' && (
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-fade-up">
                            <div className="bg-[#FFCC00] p-4 text-[#003366] font-bold flex justify-between items-center">
                                <span>MTN MoMo</span>
                                <Smartphone size={20} />
                            </div>
                            <div className="p-6 text-center">
                                <RefreshCw size={40} className="animate-spin text-primary mx-auto mb-4" />
                                <h4 className="font-bold text-lg mb-2">Complete Your Payment</h4>
                                <p className="text-sm text-gray-600 mb-2">A secure payment tab has opened. Complete the charge there, then return here — we'll detect it automatically.</p>
                                <p className="font-bold text-lg mb-6">GH₵{bookedServiceDetails?.price}</p>
                                <div className="bg-primary/10 text-primary text-sm font-bold py-2 px-4 rounded-lg inline-block mb-6">
                                    Waiting for approval ({momoCountdown}s)
                                </div>
                                <button 
                                    className="w-full py-3 rounded-lg border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                        cleanIntervals();
                                        setPaymentSimulationStep('none');
                                    }}
                                >
                                    Cancel Transaction
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {paymentSimulationStep === 'processing' && (
                        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full animate-fade-up">
                            <RefreshCw size={48} className="animate-spin text-primary mx-auto mb-4" />
                            <h3 className="font-bold text-xl mb-2">Processing Payment...</h3>
                            <p className="text-gray-500 text-sm">Please don't close this window.</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
