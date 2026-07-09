import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useToast } from '../context/ToastContext';
import { fetchMyAppointments, updateAppointment } from '../lib/api';
import { timeSlots } from '../data';
import './Profile.css';

interface Booking {
    id: string;
    salonId?: string;
    salonName: string;
    serviceName: string;
    stylistName: string;
    date: string;
    time: string;
    price: number;
    paymentMethod?: string;
    status?: 'confirmed' | 'cancelled' | 'rescheduled';
}

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const { getAccessTokenSilently } = useAuth0();
    const { showToast } = useToast();
    
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Reschedule modal state
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    const mapBackendStatusToFrontend = (status: string): 'confirmed' | 'cancelled' | 'rescheduled' => {
        switch (status) {
            case 'CANCELLED':
                return 'cancelled';
            case 'RESCHEDULED':
                return 'rescheduled';
            case 'CONFIRMED':
            case 'PENDING':
            default:
                return 'confirmed';
        }
    };

    const loadBookings = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await fetchMyAppointments(token);
            
            const mappedBookings: Booking[] = data.map((b: any) => {
                const dateObj = new Date(b.date);
                const dateStr = dateObj.toISOString().split('T')[0];
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                const paymentMatch = b.notes?.match(/Payment:\s*(\w+)/);
                const paymentMethod = paymentMatch ? paymentMatch[1] : 'cash';

                return {
                    id: b.id,
                    salonId: b.salonId,
                    salonName: b.salon?.name || 'Unknown Salon',
                    serviceName: b.service?.name || 'Unknown Service',
                    stylistName: b.stylist?.name || 'Any',
                    date: dateStr,
                    time: timeStr,
                    price: b.service?.price || 0,
                    status: mapBackendStatusToFrontend(b.status),
                    paymentMethod,
                };
            });
            
            setBookings(mappedBookings);
        } catch (err) {
            console.error('Failed to load appointments:', err);
            showToast('Failed to load appointments.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [getAccessTokenSilently]);

    const handleCancel = async (id: string) => {
        try {
            const token = await getAccessTokenSilently();
            await updateAppointment(id, { status: 'CANCELLED' }, token);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
            const booking = bookings.find(b => b.id === id);
            if (booking) addNotification(`Booking at ${booking.salonName} has been cancelled.`, 'info');
            showToast('Booking cancelled successfully.', 'success');
        } catch (err) {
            console.error('Failed to cancel booking:', err);
            showToast('Failed to cancel booking. Please try again.', 'error');
        }
    };

    const handleBookAgain = (booking: Booking) => {
        const params = new URLSearchParams();
        if (booking.salonId) params.set('salon', booking.salonId);
        navigate(`/booking?${params.toString()}`);
    };

    const openReschedule = (id: string) => {
        const b = bookings.find(bk => bk.id === id);
        setRescheduleId(id);
        setNewDate(b?.date || '');
        setNewTime(b?.time || '');
    };

    const handleReschedule = async () => {
        if (!newDate || !newTime || !rescheduleId) return;
        
        try {
            // Parse newTime string (e.g. "10:00 AM")
            const timeParts = newTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            let hours = 9;
            let minutes = 0;
            if (timeParts) {
                hours = parseInt(timeParts[1], 10);
                minutes = parseInt(timeParts[2], 10);
                const period = timeParts[3].toUpperCase();
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }
            
            const combinedDate = new Date(`${newDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
            
            const token = await getAccessTokenSilently();
            await updateAppointment(rescheduleId, { date: combinedDate.toISOString(), status: 'RESCHEDULED' }, token);
            
            setBookings(prev => prev.map(b =>
                b.id === rescheduleId ? { ...b, date: newDate, time: newTime, status: 'rescheduled' as const } : b
            ));
            
            const booking = bookings.find(b => b.id === rescheduleId);
            if (booking) addNotification(`Booking at ${booking.salonName} rescheduled to ${newDate} at ${newTime}.`, 'success');
            showToast('Booking rescheduled successfully.', 'success');
            
            setRescheduleId(null);
            setNewDate('');
            setNewTime('');
        } catch (err) {
            console.error('Failed to reschedule booking:', err);
            showToast('Failed to reschedule booking. Please try again.', 'error');
        }
    };

    const paymentLabel: Record<string, string> = {
        momo: 'MTN MoMo', orange: 'Orange Money', card: 'Card', cash: 'Cash',
    };

    const reschedulingBooking = bookings.find(b => b.id === rescheduleId);

    return (
        <main className="profile-page">
            {/* Hero */}
            <section className="profile-hero">
                <div className="container">
                    <div className="profile-hero-inner">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1>{user?.name}</h1>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reschedule Modal */}
            {rescheduleId && reschedulingBooking && (
                <div className="reschedule-overlay" onClick={() => setRescheduleId(null)}>
                    <div className="reschedule-modal" onClick={e => e.stopPropagation()}>
                        <h3>Reschedule Appointment</h3>
                        <p className="reschedule-subtitle">{reschedulingBooking.salonName} — {reschedulingBooking.serviceName}</p>

                        <div className="form-group">
                            <label>New Date</label>
                            <input
                                type="date"
                                value={newDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setNewDate(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>New Time</label>
                            <div className="reschedule-time-grid">
                                {timeSlots.filter(s => s.available).map(slot => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        className={`reschedule-time-slot ${newTime === slot.time ? 'selected' : ''}`}
                                        onClick={() => setNewTime(slot.time)}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="reschedule-actions">
                            <button className="btn btn-primary" onClick={handleReschedule} disabled={!newDate || !newTime}>
                                Confirm Reschedule
                            </button>
                            <button className="btn btn-outline" onClick={() => setRescheduleId(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointments */}
            <section className="appointments-section">
                <div className="container">
                    <div className="section-header">
                        <h2>My Appointments</h2>
                        <p>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} found</p>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Loading your appointments...
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="profile-empty">
                            <p>You haven't booked any appointments yet.</p>
                            <Link to="/services" className="btn btn-primary">Browse Services</Link>
                        </div>
                    ) : (
                        <div className="bookings-grid">
                            {bookings.map((booking) => (
                                <div key={booking.id} className={`booking-item ${booking.status === 'cancelled' ? 'item-cancelled' : ''}`}>
                                    <div className="booking-item-info">
                                        <h4>{booking.salonName}</h4>
                                        <p className="service-name">{booking.serviceName}</p>
                                        <p className="booking-meta">
                                            {booking.date} at {booking.time} • Stylist: {booking.stylistName}
                                            {booking.paymentMethod && (
                                                <span> • {paymentLabel[booking.paymentMethod] || booking.paymentMethod}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="booking-item-right">
                                        <span className={`badge ${booking.status === 'cancelled' ? 'badge-cancelled' : booking.status === 'rescheduled' ? 'badge-rescheduled' : 'badge-confirmed'}`}>
                                            {booking.status === 'cancelled' ? 'Cancelled' : booking.status === 'rescheduled' ? 'Rescheduled' : 'Confirmed'}
                                        </span>
                                        <span className="booking-price">${booking.price}</span>
                                        {booking.status === 'cancelled' ? (
                                            <button className="rebook-btn" onClick={() => handleBookAgain(booking)}>Book Again</button>
                                        ) : (
                                            <div className="booking-actions-row">
                                                <button className="reschedule-btn" onClick={() => openReschedule(booking.id)}>Reschedule</button>
                                                <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
