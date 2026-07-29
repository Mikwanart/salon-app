import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useToast } from '../context/ToastContext';
import { fetchMyAppointments, updateAppointment, fetchSalons } from '../lib/api';
import { mapApiSalonToFrontendSalon } from '../data';
import { Calendar, History, User, LogOut, Clock, Star, Scissors } from 'lucide-react';
import './Profile.css';

interface Booking {
    id: string;
    salonId?: string;
    salonName: string;
    salonImage?: string;
    serviceName: string;
    stylistName: string;
    date: string;
    time: string;
    price: number;
    paymentMethod?: string;
    paymentStatus?: string;
    status?: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'pending';
    fallbackImage?: string;
}

interface RecommendedSalon {
    id: string;
    name: string;
    image: string;
    rating: number;
    description: string;
    city: string;
    location: string;
}

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { addNotification, syncWithAppointments } = useNotifications();
    const { getAccessTokenSilently } = useAuth0();
    const { showToast } = useToast();
    
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [recommendedSalons, setRecommendedSalons] = useState<RecommendedSalon[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [isLoadingSalons, setIsLoadingSalons] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const mapBackendStatusToFrontend = (status: string): Booking['status'] => {
        switch (status) {
            case 'CANCELLED':
                return 'cancelled';
            case 'RESCHEDULED':
                return 'rescheduled';
            case 'COMPLETED':
                return 'completed';
            case 'PENDING':
                return 'pending';
            case 'CONFIRMED':
            default:
                return 'confirmed';
        }
    };

    const loadAppointments = async (token: string) => {
        setIsLoadingAppointments(true);
        try {
            const data = await fetchMyAppointments(token);
            syncWithAppointments(data, false);
            
            const sortedData = [...data].sort((a: any, b: any) => {
                const timeA = new Date(a.createdAt || a.date).getTime();
                const timeB = new Date(b.createdAt || b.date).getTime();
                return timeB - timeA;
            });

            const mappedBookings: Booking[] = sortedData.map((b: any) => {
                const dateObj = new Date(b.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                let serviceImage = b.service?.image;
                let serviceName = b.service?.name || 'Unknown Service';
                let salonFallbackImage = b.salon?.image || b.salon?.coverImage;
                
                if (b.salon && !salonFallbackImage) {
                    const frontendSalon = mapApiSalonToFrontendSalon(b.salon);
                    salonFallbackImage = frontendSalon.image;
                }

                const finalImage = serviceImage || salonFallbackImage || 'https://via.placeholder.com/150';

                return {
                    id: b.id,
                    salonId: b.salonId,
                    salonName: b.salon?.name || 'Unknown Salon',
                    salonImage: finalImage,
                    serviceName: serviceName,
                    stylistName: b.stylist?.name || 'Any',
                    date: dateStr,
                    time: timeStr,
                    price: b.service?.price || 0,
                    status: mapBackendStatusToFrontend(b.status),
                    paymentMethod: b.paymentMethod ? b.paymentMethod.toLowerCase() : 'cash',
                    paymentStatus: b.paymentStatus || 'PENDING',
                    fallbackImage: salonFallbackImage || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400',
                };
            });
            
            setBookings(mappedBookings);
        } catch (err) {
            console.error('Failed to load appointments:', err);
        } finally {
            setIsLoadingAppointments(false);
        }
    };

    const loadSalons = async () => {
        setIsLoadingSalons(true);
        try {
            const salonsResponse = await fetchSalons();
            const mappedSalons = salonsResponse.slice(0, 4).map((s: any) => mapApiSalonToFrontendSalon(s));
            setRecommendedSalons(mappedSalons);
        } catch (err) {
            console.error('Failed to load salons:', err);
        } finally {
            setIsLoadingSalons(false);
        }
    };

    const loadData = async () => {
        try {
            const token = await getAccessTokenSilently();
            loadAppointments(token);
            loadSalons();
        } catch (err) {
            console.error('Failed to load data:', err);
            showToast('Failed to load dashboard data.', 'error');
            setIsLoadingAppointments(false);
            setIsLoadingSalons(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [getAccessTokenSilently]);

    const handleCancel = async (id: string) => {
        setCancellingId(id);
        try {
            const token = await getAccessTokenSilently();
            await updateAppointment(id, { status: 'CANCELLED' }, token);
            
            const booking = bookings.find(b => b.id === id);
            const isPrepaid = booking && booking.paymentStatus === 'PAID' && (booking.paymentMethod === 'momo' || booking.paymentMethod === 'card');
            
            setBookings(prev => prev.map(b => b.id === id ? { 
                ...b, 
                status: 'cancelled' as const, 
                paymentStatus: isPrepaid ? 'REFUNDED' : b.paymentStatus 
            } : b));
            
            if (booking) {
                addNotification(`Booking at ${booking.salonName} has been cancelled.`, 'info');
            }
            
            if (isPrepaid) {
                showToast(`Booking cancelled. A refund of GH₵${booking?.price} has been sent.`, 'success');
            } else {
                showToast('Booking cancelled successfully.', 'success');
            }
        } catch (err) {
            console.error('Failed to cancel booking:', err);
            showToast('Failed to cancel booking. Please try again.', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    
    return (
        <div className="pd-layout">
            {/* Sidebar */}
            <aside className="pd-sidebar">
                <Link to="/" className="pd-brand">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--primary)', color: '#fff', borderRadius: '10px' }}>
                        <Scissors size={20} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <span>SalonBook</span>
                </Link>
                
                <div className="pd-sidebar-content">
                    <nav className="pd-nav">
                        <a href="#" className="pd-nav-item active">
                            <Calendar size={22} />
                            <span>Upcoming Appointments</span>
                        </a>
                        <a href="#" className="pd-nav-item">
                            <History size={22} />
                            <span>Past Bookings</span>
                        </a>
                        <a href="#" className="pd-nav-item">
                            <User size={22} />
                            <span>Profile Settings</span>
                        </a>
                    </nav>
                </div>
                
                <div className="pd-sidebar-footer">
                    <button className="pd-logout-btn" onClick={() => logout()}>
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pd-main">
                <div className="pd-content">
                    <section className="pd-greeting-section">
                        <h1>Hello, {user?.name ? user.name.split(' ')[0] : 'Guest'}!</h1>
                        <p>You have {upcomingBookings.length} appointment{upcomingBookings.length !== 1 ? 's' : ''} scheduled for this week.</p>
                    </section>

                    <section className="pd-appointments-section">
                        <div className="pd-section-header">
                            <h2>Upcoming Appointments</h2>
                        </div>
                        
                        {isLoadingAppointments ? (
                            <div className="global-loading-wrap">
                                <div className="global-spinner"></div>
                                <span className="global-loading-text">Loading appointments...</span>
                            </div>
                        ) : upcomingBookings.length === 0 ? (
                            <div className="pd-empty-state">No upcoming appointments found.</div>
                        ) : (
                            <div className="pd-appointments-grid">
                                {upcomingBookings.map(booking => (
                                    <div key={booking.id} className="pd-appointment-card">
                                        <div className="pd-appointment-img-wrap">
                                            <img 
                                                src={booking.salonImage} 
                                                alt={booking.salonName} 
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (booking.fallbackImage && target.src !== booking.fallbackImage) {
                                                        target.src = booking.fallbackImage;
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="pd-appointment-details">
                                            <div>
                                                <div className="pd-appointment-meta">
                                                    <span className={`pd-status-badge ${booking.status}`}>{booking.status}</span>
                                                    <span className="pd-booking-id">ID: #{booking.id.substring(0, 6).toUpperCase()}</span>
                                                </div>
                                                <h3 className="pd-service-name">{booking.serviceName}</h3>
                                                <p className="pd-salon-stylist">{booking.salonName} • {booking.stylistName}</p>
                                                
                                                <div className="pd-datetime">
                                                    <div className="pd-datetime-item">
                                                        <Calendar size={18} />
                                                        {booking.date}
                                                    </div>
                                                    <div className="pd-datetime-item">
                                                        <Clock size={18} />
                                                        {booking.time}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pd-appointment-actions">
                                                <button className="pd-btn-outline" onClick={() => navigate(`/booking?salon=${booking.salonId}`)}>Reschedule</button>
                                                <button className="pd-btn-danger" onClick={() => handleCancel(booking.id)} disabled={cancellingId === booking.id}>
                                                    {cancellingId === booking.id ? <div className="global-spinner small"></div> : 'Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="pd-recommended-section">
                        <div className="pd-section-header pd-col-header">
                            <h2>Recommended for You</h2>
                            <p>Based on your recent hair treatments</p>
                        </div>
                        
                        {isLoadingSalons ? (
                            <div className="global-loading-wrap">
                                <div className="global-spinner"></div>
                                <span className="global-loading-text">Loading recommendations...</span>
                            </div>
                        ) : (
                            <div className="pd-recommended-grid">
                                {recommendedSalons.map(salon => (
                                    <div key={salon.id} className="pd-salon-card">
                                        <div className="pd-salon-img-wrap">
                                            <img src={salon.image || 'https://via.placeholder.com/300x200?text=Salon'} alt={salon.name} />
                                        </div>
                                        <div className="pd-salon-info">
                                            <div className="pd-salon-title-row">
                                                <h4 className="pd-salon-name">{salon.name}</h4>
                                                <div className="pd-salon-rating">
                                                    <Star size={14} fill="currentColor" />
                                                    <span>{salon.rating || '4.8'}</span>
                                                </div>
                                            </div>
                                            <p className="pd-salon-desc">{salon.location || salon.city || 'Top Rated Salon'}</p>
                                            <div className="pd-salon-footer" style={{ justifyContent: 'flex-end' }}>
                                                <Link to={`/salon/${salon.id}`} className="pd-btn-primary">View</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
