import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
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
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Reschedule modal state
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    useEffect(() => {
        const savedBookings = localStorage.getItem('salon_bookings');
        if (savedBookings) {
            const parsed: Booking[] = JSON.parse(savedBookings);
            parsed.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setBookings(parsed);
        }
    }, []);

    const saveBookings = (updated: Booking[]) => {
        setBookings(updated);
        localStorage.setItem('salon_bookings', JSON.stringify(updated));
    };

    const handleCancel = (id: string) => {
        const booking = bookings.find(b => b.id === id);
        const updated = bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' as const } : b
        );
        saveBookings(updated);
        if (booking) addNotification(`Booking at ${booking.salonName} has been cancelled.`, 'info');
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

    const handleReschedule = () => {
        if (!newDate || !newTime) return;
        const booking = bookings.find(b => b.id === rescheduleId);
        const updated = bookings.map(b =>
            b.id === rescheduleId ? { ...b, date: newDate, time: newTime, status: 'rescheduled' as const } : b
        );
        saveBookings(updated);
        if (booking) addNotification(`Booking at ${booking.salonName} rescheduled to ${newDate} at ${newTime}.`, 'success');
        setRescheduleId(null);
        setNewDate('');
        setNewTime('');
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

                    {bookings.length === 0 ? (
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
