import { useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { 
    fetchSalonOwnerAppointments, 
    fetchSalonOwnerSalons,
    fetchSalonOwnerSalon,
    updateSalonOwnerSalon,
    createSalonService, updateSalonService, deleteSalonService,
    createSalonStylist, updateSalonStylist, deleteSalonStylist,
    updateAppointment
} from '../lib/api';
import {
    LineChart, Line, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, XCircle, BarChart2, Scissors, Users, Plus, Edit2, Trash2, CheckCircle, Store } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import './Dashboard.css';
import './ForSalons.css';

interface RawAppointment {
    id: string;
    date: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    notes?: string;
    client: { id: string; name: string; email: string; phone?: string };
    salon: { id: string; name: string };
    service: { id: string; name: string; price: number; duration: number; category: string };
    stylist?: { id: string; name: string; role: string };
}

export default function Dashboard() {
    const { getAccessTokenSilently } = useAuth0();
    const { showToast } = useToast();
    const { syncWithAppointments } = useNotifications();
    
    const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'salon' | 'services' | 'stylists'>('overview');
    const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([]);
    const [ownerSalons, setOwnerSalons] = useState<any[]>([]);
    const [selectedSalonId, setSelectedSalonId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);


    const ownerSalon = useMemo(() => {
        if (!ownerSalons || ownerSalons.length === 0) return null;
        return ownerSalons.find(s => s.id === selectedSalonId) || ownerSalons[0];
    }, [ownerSalons, selectedSalonId]);

    const salonAppointments = useMemo(() => {
        if (!ownerSalon) return [];
        return rawAppointments.filter(app => app.salon?.id === ownerSalon.id);
    }, [rawAppointments, ownerSalon]);



    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const [appointments, salons] = await Promise.all([
                fetchSalonOwnerAppointments(token).catch(() => []),
                fetchSalonOwnerSalons(token).catch(async () => {
                    const single = await fetchSalonOwnerSalon(token).catch(() => null);
                    return single ? [single] : [];
                }),
            ]);
            setRawAppointments(appointments);
            const validSalons = Array.isArray(salons) ? salons : (salons ? [salons] : []);
            setOwnerSalons(validSalons);

            if (validSalons.length > 0) {
                const savedId = localStorage.getItem('selected_salon_id');
                const matchingSaved = validSalons.find((s: any) => s.id === savedId);
                setSelectedSalonId(matchingSaved ? savedId! : validSalons[0].id);
            }

            if (appointments && appointments.length > 0) {
                syncWithAppointments(appointments, true);
            }
        } catch (err) {
            console.error('Failed to load dashboard', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [getAccessTokenSilently]);

    if (isLoading && !ownerSalon) {
        return (
            <main className="dashboard-page">
                <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Loading your dashboard...</span>
                </div>
            </main>
        );
    }

    if (!ownerSalon) {
        return (
            <main className="dashboard-page">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px 16px' }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                        <Store size={64} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                        <h2>Welcome to SalonBook</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            You haven't registered any salons yet. Create your first salon to access the owner dashboard.
                        </p>
                        <Link to="/for-salons" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                            Create Your Salon
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="dashboard-page dashboard-layout">
            {/* Sidebar Navigation */}
            <aside className="dashboard-sidebar">
                <Link to="/" className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--primary)', color: '#fff', borderRadius: '10px' }}>
                        <Scissors size={20} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <span>SalonBook</span>
                </Link>

                <nav className="sidebar-nav">
                    <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <BarChart2 size={20}/> Overview
                    </button>
                    <button className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                        <Calendar size={20}/> Appointments
                    </button>
                    <button className={`nav-link ${activeTab === 'salon' ? 'active' : ''}`} onClick={() => setActiveTab('salon')}>
                        <Store size={20}/> Salon Info
                    </button>
                    <button className={`nav-link ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
                        <Scissors size={20}/> Services
                    </button>
                    <button className={`nav-link ${activeTab === 'stylists' ? 'active' : ''}`} onClick={() => setActiveTab('stylists')}>
                        <Users size={20}/> Stylists
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                {/* Topbar */}
                <header className="dashboard-topbar">
                    <h2 className="topbar-title">{ownerSalon.name} - Salon Owner Portal</h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {ownerSalons.length > 1 ? (
                            <select
                                className="select-salon-dropdown"
                                value={ownerSalon.id}
                                onChange={(e) => {
                                    if (e.target.value === 'REGISTER_NEW') {
                                        window.location.href = '/for-salons';
                                    } else {
                                        setSelectedSalonId(e.target.value);
                                        localStorage.setItem('selected_salon_id', e.target.value);
                                        const sName = ownerSalons.find(s => s.id === e.target.value)?.name;
                                        showToast(`Switched view to ${sName}`, 'info');
                                    }
                                }}
                            >
                                {ownerSalons.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.city})
                                    </option>
                                ))}
                                <option value="REGISTER_NEW">+ Register Another Salon</option>
                            </select>
                        ) : (
                            <Link
                                to="/for-salons"
                                className="btn btn-outline btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Plus size={14} /> Add Another Salon
                            </Link>
                        )}
                    </div>
                </header>

                <div className="dashboard-content-area">
                    {activeTab === 'overview' && <OverviewTab rawAppointments={salonAppointments} />}
                    {activeTab === 'appointments' && <AppointmentsTab rawAppointments={salonAppointments} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'salon' && <SalonInfoTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'services' && <ServicesTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'stylists' && <StylistsTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                </div>
            </main>


        </div>
    );
}

// ---------------------------------------------------------
// OVERVIEW TAB
// ---------------------------------------------------------
function OverviewTab({ rawAppointments }: { rawAppointments: RawAppointment[] }) {
    const bookings = useMemo(() => {
        return [...rawAppointments]
            .sort((a: any, b: any) => {
                const timeA = new Date(a.createdAt || a.date).getTime();
                const timeB = new Date(b.createdAt || b.date).getTime();
                return timeB - timeA;
            })
            .map((a) => {
            const dateObj = new Date(a.date);
            return {
                id: a.id,
                customerName: a.client?.name || 'Unknown',
                customerEmail: a.client?.email || '',
                serviceName: a.service?.name || 'Unknown Service',
                serviceCategory: a.service?.category || '',
                price: a.service?.price || 0,
                stylistName: a.stylist?.name || 'Any Stylist',
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: a.status?.toLowerCase(),
                paymentMethod: a.paymentMethod?.toLowerCase(),
                paymentStatus: a.paymentStatus,
            };
        });
    }, [rawAppointments]);

    const confirmed   = bookings.filter(b => b.status !== 'cancelled');
    const cancelled   = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.price, 0);
    const avgValue    = confirmed.length ? Math.round(totalRevenue / confirmed.length) : 0;
    const cancelRate  = bookings.length ? ((cancelled.length / bookings.length) * 100).toFixed(1) : 0;

    const revenueData = useMemo(() => {
        const days: { label: string; revenue: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const dayBookings = confirmed.filter(b => b.date === dateStr);
            days.push({
                label,
                revenue: dayBookings.reduce((s, b) => s + b.price, 0),
            });
        }
        return days;
    }, [confirmed]);

    const serviceData = useMemo(() => {
        const map: Record<string, number> = {};
        confirmed.forEach(b => { map[b.serviceName] = (map[b.serviceName] || 0) + 1; });
        const total = confirmed.length || 1;
        return Object.entries(map).map(([name, count]) => ({
            name,
            percent: Math.round((count / total) * 100)
        })).sort((a, b) => b.percent - a.percent).slice(0, 3);
    }, [confirmed]);

    return (
        <div className="fade-in">
            {/* Business Overview Stats */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap"><Calendar size={20} /></div>
                        <span className="kpi-badge trend">+12% <TrendingUp size={12}/></span>
                    </div>
                    <p className="kpi-label">Total Bookings</p>
                    <h3 className="kpi-value">{confirmed.length}</h3>
                    <p className="kpi-subtext">vs last month</p>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap"><DollarSign size={20} /></div>
                        <span className="kpi-badge trend">+8% <TrendingUp size={12}/></span>
                    </div>
                    <p className="kpi-label">Total Revenue</p>
                    <h3 className="kpi-value">GHC {totalRevenue.toLocaleString()}</h3>
                    <p className="kpi-subtext">vs last week</p>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap"><TrendingUp size={20} /></div>
                        <span className="kpi-badge status">Optimal</span>
                    </div>
                    <p className="kpi-label">Avg. Booking Value</p>
                    <h3 className="kpi-value">GHC {avgValue}</h3>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap"><XCircle size={20} /></div>
                        <span className="kpi-badge status" style={{ backgroundColor: 'rgba(132,253,100,0.2)', color: 'var(--tertiary)' }}>Low</span>
                    </div>
                    <p className="kpi-label">Cancellation Rate</p>
                    <h3 className="kpi-value">{cancelRate}%</h3>
                </div>
            </div>

            {/* Dashboard Layout (Asymmetric) */}
            <div className="dashboard-grid-main">
                {/* Revenue Line Chart */}
                <section className="chart-section" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                    <div className="chart-header">
                        <div>
                            <h3>Upcoming Revenue — Next 7 Days</h3>
                            <p>Projected daily revenue</p>
                        </div>
                        <div className="chart-legend">
                            <div className="chart-legend-dot"></div> GHC
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {confirmed.length === 0 ? <div className="chart-empty" style={{ paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings yet.</div> :
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--on-surface-variant)', fontWeight: 700 }} dy={10} />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--surface-card)', border: '1px solid rgba(177, 14, 107, 0.1)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        cursor={{ stroke: 'rgba(177, 14, 107, 0.1)', strokeWidth: 2 }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--primary)', stroke: '#fff', strokeWidth: 2 }} />
                                    <Line type="monotone" dataKey="revenue" stroke="none" fill="url(#revenueGradient)" activeDot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        }
                    </div>
                </section>

                {/* Top Services */}
                <section className="chart-section">
                    <div className="chart-header">
                        <h3>Top Services</h3>
                    </div>
                    {serviceData.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No service data yet</div> :
                        <div className="top-services-list">
                            {serviceData.map((svc, i) => (
                                <div className="service-item" key={i}>
                                    <div className="service-item-header">
                                        <span className="name">{svc.name}</span>
                                        <span className="percent">{svc.percent}%</span>
                                    </div>
                                    <div className="service-progress-bg">
                                        <div className="service-progress-fill" style={{ width: `${svc.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </section>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// APPOINTMENTS TAB
// ---------------------------------------------------------
function AppointmentsTab({ rawAppointments, reload, getAccessTokenSilently, showToast }: any) {
    const { addNotificationForUser, updateNotificationActionStatus } = useNotifications();

    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleUpdateStatus = async (a: any, newStatus: string) => {
        const actionLabel = newStatus === 'CONFIRMED' ? 'Accept' : newStatus === 'CANCELLED' ? 'Decline' : newStatus;
        if (!confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this appointment for ${a.client?.name || 'this client'}?`)) return;
        setUpdatingId(a.id);
        try {
            const token = await getAccessTokenSilently();
            await updateAppointment(a.id, { status: newStatus }, token);
            
            showToast(`Appointment ${newStatus === 'CONFIRMED' ? 'Accepted' : newStatus === 'CANCELLED' ? 'Declined' : 'Updated'}`, newStatus === 'CANCELLED' ? 'info' : 'success');
            updateNotificationActionStatus(a.id, newStatus as any);

            // Send in-app notification to the client account!
            if (a.client?.email) {
                const isAccept = newStatus === 'CONFIRMED';
                addNotificationForUser(a.client.email, {
                    message: isAccept 
                        ? `🎉 ${a.salon?.name || 'The salon'} ACCEPTED your booking for ${a.service?.name} on ${new Date(a.date).toLocaleDateString()}!`
                        : `❌ ${a.salon?.name || 'The salon'} DECLINED your booking request for ${a.service?.name}.`,
                    type: isAccept ? 'success' : 'error',
                    appointmentId: a.id,
                    status: newStatus as any,
                });
            }

            reload();
        } catch (e) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const sortedAppointments = useMemo(() => {
        return [...rawAppointments].sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt || a.date).getTime();
            const timeB = new Date(b.createdAt || b.date).getTime();
            return timeB - timeA;
        });
    }, [rawAppointments]);

    if (rawAppointments.length === 0) return <div className="chart-empty">No appointments found.</div>;

    return (
        <div className="recent-bookings-card fade-in">
            <div className="card-header-flex">
                <div>
                    <h3>Appointments</h3>
                    <p className="card-subtitle">Manage customer bookings and schedule</p>
                </div>
            </div>
            <div className="bookings-table-wrap">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.map((a: any) => (
                            <tr key={a.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{a.client?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.client?.email}</div>
                                </td>
                                <td>{a.service?.name}</td>
                                <td>
                                    <div>{new Date(a.date).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(a.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${a.status.toLowerCase()}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td>
                                    {a.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button className="btn btn-sm" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={updatingId === a.id} onClick={() => handleUpdateStatus(a, 'CONFIRMED')}>
                                                {updatingId === a.id ? <div className="global-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <CheckCircle size={14}/>} Accept
                                            </button>
                                            <button className="btn btn-sm" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={updatingId === a.id} onClick={() => handleUpdateStatus(a, 'CANCELLED')}>
                                                {updatingId === a.id ? <div className="global-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <XCircle size={14}/>} Decline
                                            </button>
                                        </div>
                                    )}
                                    {a.status === 'CONFIRMED' && (
                                        <button className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={updatingId === a.id} onClick={() => handleUpdateStatus(a, 'COMPLETED')}>
                                            {updatingId === a.id ? <div className="global-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <CheckCircle size={14}/>} Complete
                                        </button>
                                    )}
                                    {a.status === 'COMPLETED' && <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Done</span>}
                                    {a.status === 'CANCELLED' && <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Declined / Cancelled</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SALON INFO TAB
// ---------------------------------------------------------
function SalonInfoTab({ salon, reload, getAccessTokenSilently, showToast }: any) {
    const [formData, setFormData] = useState({
        name: salon.name,
        description: salon.description || '',
        address: salon.address || '',
        city: salon.city || '',
        phone: salon.phone || '',
        coverImage: salon.coverImage || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await getAccessTokenSilently();
            await updateSalonOwnerSalon(token, formData);
            showToast('Salon updated successfully', 'success');
            reload();
        } catch (e) {
            showToast('Failed to update salon', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mgmt-form fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
                <h3>Salon Profile</h3>
                <p className="card-subtitle">Update your salon information and cover photo</p>
            </div>
            <div className="form-group">
                <label>Salon Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Cover Image URL</label>
                    <input type="url" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} placeholder="https://..." />
                </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} disabled={saving}>
                {saving && <div className="global-spinner small" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
        </form>
    );
}

// ---------------------------------------------------------
// SERVICES TAB
// ---------------------------------------------------------
function ServicesTab({ salon, reload, getAccessTokenSilently, showToast }: any) {
    const [editing, setEditing] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        setDeletingId(id);
        try {
            const token = await getAccessTokenSilently();
            await deleteSalonService(token, id);
            showToast('Service deleted', 'success');
            reload();
        } catch(e) {
            showToast('Failed to delete', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fade-in">
            {editing ? (
                <ServiceForm 
                    salon={salon}
                    service={editing.id ? editing : null} 
                    onCancel={() => setEditing(null)} 
                    onSuccess={() => { setEditing(null); reload(); }} 
                    getAccessTokenSilently={getAccessTokenSilently}
                    showToast={showToast}
                />
            ) : (
                <div className="recent-bookings-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Services</h3>
                            <p className="card-subtitle">Manage service menu, pricing, and duration</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={16}/> Add Service</button>
                    </div>
                    <table className="bookings-table">
                        <thead>
                            <tr><th>Name</th><th>Category</th><th>Price</th><th>Duration</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {salon.services?.map((s: any) => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.category}</td>
                                    <td>GH₵{s.price}</td>
                                    <td>{s.duration} min</td>
                                    <td>
                                        <div className="action-btn-flex">
                                            <button className="btn-icon" title="Edit" onClick={() => setEditing(s)}><Edit2 size={16}/></button>
                                            <button className="btn-icon danger" title="Delete" disabled={deletingId === s.id} onClick={() => handleDelete(s.id)}>
                                                {deletingId === s.id ? <div className="global-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Trash2 size={16}/>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ServiceForm({ salon, service, onCancel, onSuccess, getAccessTokenSilently, showToast }: any) {
    const [formData, setFormData] = useState(service || { name: '', category: 'Haircare', price: 0, duration: 30, description: '' });
    const [saving, setSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await getAccessTokenSilently();
            if (service?.id) {
                await updateSalonService(token, service.id, { ...formData, price: Number(formData.price), duration: Number(formData.duration) });
                showToast('Service updated', 'success');
            } else {
                await createSalonService(token, { ...formData, salonId: salon?.id, price: Number(formData.price), duration: Number(formData.duration) });
                showToast('Service created', 'success');
            }
            onSuccess();
        } catch(e) {
            showToast('Failed to save service', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mgmt-form">
            <h3>{service?.id ? 'Edit Service' : 'New Service'}</h3>
            <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
                <label>Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Price (GH₵)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required min="0" />
                </div>
                <div className="form-group">
                    <label>Duration (mins)</label>
                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required min="5" />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} disabled={saving}>
                    {saving && <div className="global-spinner small" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                    {saving ? 'Saving...' : (service?.id ? 'Save Service' : 'Add Service')}
                </button>
                <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
            </div>
        </form>
    );
}

// ---------------------------------------------------------
// STYLISTS TAB
// ---------------------------------------------------------
function StylistsTab({ salon, reload, getAccessTokenSilently, showToast }: any) {
    const [editing, setEditing] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this stylist?')) return;
        setDeletingId(id);
        try {
            const token = await getAccessTokenSilently();
            await deleteSalonStylist(token, id);
            showToast('Stylist deleted', 'success');
            reload();
        } catch(e) {
            showToast('Failed to delete', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fade-in">
            {editing ? (
                <StylistForm 
                    salon={salon}
                    stylist={editing.id ? editing : null} 
                    onCancel={() => setEditing(null)} 
                    onSuccess={() => { setEditing(null); reload(); }} 
                    getAccessTokenSilently={getAccessTokenSilently}
                    showToast={showToast}
                />
            ) : (
                <div className="recent-bookings-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Stylists & Staff</h3>
                            <p className="card-subtitle">Manage staff members, roles, and specialties</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={16}/> Add Stylist</button>
                    </div>
                    <table className="bookings-table">
                        <thead>
                            <tr><th>Name</th><th>Role</th><th>Specialties</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {salon.stylists?.map((s: any) => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img 
                                                src={s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Stylist')}&background=random`} 
                                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Stylist')}&background=random`; }}
                                                alt="" 
                                                style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover'}} 
                                            />
                                            {s.name}
                                        </div>
                                    </td>
                                    <td>{s.role}</td>
                                    <td>{s.specialties?.join(', ') || '-'}</td>
                                    <td>
                                        <div className="action-btn-flex">
                                            <button className="btn-icon" title="Edit" onClick={() => setEditing(s)}><Edit2 size={16}/></button>
                                            <button className="btn-icon danger" title="Delete" disabled={deletingId === s.id} onClick={() => handleDelete(s.id)}>
                                                {deletingId === s.id ? <div className="global-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Trash2 size={16}/>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const WORKING_DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
];

const defaultWorkingHours = () =>
    WORKING_DAYS.reduce((acc: any, d) => {
        acc[d.key] = d.key === 'sun' ? null : { start: '09:00', end: '18:00' };
        return acc;
    }, {});

function StylistForm({ salon, stylist, onCancel, onSuccess, getAccessTokenSilently, showToast }: any) {
    const [formData, setFormData] = useState(stylist || { name: '', role: '', image: '', specialtiesStr: '' });
    const [workingHours, setWorkingHours] = useState<any>(stylist?.workingHours || defaultWorkingHours());
    const [saving, setSaving] = useState(false);
    
    // Convert specialties array to string for editing
    useEffect(() => {
        if (stylist?.specialties) {
            setFormData((prev: any) => ({ ...prev, specialtiesStr: stylist.specialties.join(', ') }));
        }
        setWorkingHours(stylist?.workingHours || defaultWorkingHours());
    }, [stylist]);

    const toggleDay = (dayKey: string, isWorking: boolean) => {
        setWorkingHours((prev: any) => ({
            ...prev,
            [dayKey]: isWorking ? { start: '09:00', end: '18:00' } : null,
        }));
    };

    const updateDayTime = (dayKey: string, field: 'start' | 'end', value: string) => {
        setWorkingHours((prev: any) => ({
            ...prev,
            [dayKey]: { ...(prev[dayKey] || { start: '09:00', end: '18:00' }), [field]: value },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const specialties = formData.specialtiesStr.split(',').map((s: string) => s.trim()).filter(Boolean);
        const payload = { ...formData, specialties, salonId: salon?.id, workingHours };
        try {
            const token = await getAccessTokenSilently();
            if (stylist?.id) {
                await updateSalonStylist(token, stylist.id, payload);
                showToast('Stylist updated', 'success');
            } else {
                await createSalonStylist(token, payload);
                showToast('Stylist created', 'success');
            }
            onSuccess();
        } catch(e) {
            showToast('Failed to save stylist', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mgmt-form">
            <h3>{stylist?.id ? 'Edit Stylist' : 'New Stylist'}</h3>
            <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
                <label>Role</label>
                <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required placeholder="e.g. Senior Stylist" />
            </div>
            <div className="form-group">
                <label>Image URL</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group">
                <label>Specialties (comma separated)</label>
                <input type="text" value={formData.specialtiesStr} onChange={e => setFormData({...formData, specialtiesStr: e.target.value})} placeholder="Braids, Coloring, Extensions" />
            </div>

            <div className="form-group">
                <label>Working Hours</label>
                <div className="working-hours-editor">
                    {WORKING_DAYS.map(({ key, label }) => {
                        const dayHours = workingHours[key];
                        const isWorking = !!dayHours;
                        return (
                            <div key={key} className="working-hours-row">
                                <label className="working-hours-day-toggle">
                                    <input
                                        type="checkbox"
                                        checked={isWorking}
                                        onChange={(e) => toggleDay(key, e.target.checked)}
                                    />
                                    {label}
                                </label>
                                {isWorking ? (
                                    <div className="working-hours-times">
                                        <input
                                            type="time"
                                            value={dayHours.start}
                                            onChange={(e) => updateDayTime(key, 'start', e.target.value)}
                                        />
                                        <span>to</span>
                                        <input
                                            type="time"
                                            value={dayHours.end}
                                            onChange={(e) => updateDayTime(key, 'end', e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <span className="working-hours-off">Day off</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} disabled={saving}>
                    {saving && <div className="global-spinner small" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                    {saving ? 'Saving...' : (stylist?.id ? 'Save Stylist' : 'Add Stylist')}
                </button>
                <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
            </div>
        </form>
    );
}
