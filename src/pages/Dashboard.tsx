import { useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { 
    fetchSalonOwnerAppointments, 
    fetchSalonOwnerSalon,
    updateSalonOwnerSalon,
    createSalonService, updateSalonService, deleteSalonService,
    createSalonStylist, updateSalonStylist, deleteSalonStylist,
    updateAppointment
} from '../lib/api';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, XCircle, BarChart2, MapPin, Phone, Scissors, Users, Settings, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Dashboard.css';

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
    
    const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'salon' | 'services' | 'stylists'>('overview');
    const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([]);
    const [ownerSalon, setOwnerSalon] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const [appointments, salon] = await Promise.all([
                fetchSalonOwnerAppointments(token),
                fetchSalonOwnerSalon(token).catch(() => null),
            ]);
            setRawAppointments(appointments);
            setOwnerSalon(salon);
        } catch (err) {
            console.error('Failed to load dashboard', err);
            setError('Could not load dashboard data. Make sure you own a registered salon.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [getAccessTokenSilently]);

    if (isLoading && !ownerSalon) {
        return <main className="dashboard-page"><div style={{ textAlign: 'center', padding: '40px' }}>Loading your dashboard...</div></main>;
    }

    if (error || !ownerSalon) {
        return (
            <main className="dashboard-page">
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <BarChart2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p>{error || 'No salon assigned to this user.'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <section className="dashboard-header">
                <div className="container">
                    <div className="dashboard-title-row">
                        <div>
                            <h1><BarChart2 size={28} /> Salon Dashboard</h1>
                            <p>Managing: {ownerSalon.name}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                            {ownerSalon.address && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={14} /> {ownerSalon.city}
                                </span>
                            )}
                            {ownerSalon.phone && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Phone size={14} /> {ownerSalon.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-tabs">
                        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><BarChart2 size={16}/> Overview</button>
                        <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}><Calendar size={16}/> Appointments</button>
                        <button className={`tab-btn ${activeTab === 'salon' ? 'active' : ''}`} onClick={() => setActiveTab('salon')}><Settings size={16}/> Salon Info</button>
                        <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}><Scissors size={16}/> Services</button>
                        <button className={`tab-btn ${activeTab === 'stylists' ? 'active' : ''}`} onClick={() => setActiveTab('stylists')}><Users size={16}/> Stylists</button>
                    </div>
                </div>
            </section>

            <section className="section dashboard-content">
                <div className="container">
                    {activeTab === 'overview' && <OverviewTab rawAppointments={rawAppointments} />}
                    {activeTab === 'appointments' && <AppointmentsTab rawAppointments={rawAppointments} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'salon' && <SalonInfoTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'services' && <ServicesTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                    {activeTab === 'stylists' && <StylistsTab salon={ownerSalon} reload={loadData} getAccessTokenSilently={getAccessTokenSilently} showToast={showToast} />}
                </div>
            </section>
        </main>
    );
}

// ---------------------------------------------------------
// OVERVIEW TAB
// ---------------------------------------------------------
function OverviewTab({ rawAppointments }: { rawAppointments: RawAppointment[] }) {
    const bookings = useMemo(() => {
        return rawAppointments.map((a) => {
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
    const cancelRate  = bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0;

    const revenueData = useMemo(() => {
        const days: { label: string; revenue: number; bookings: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayBookings = confirmed.filter(b => b.date === dateStr);
            days.push({
                label,
                revenue: dayBookings.reduce((s, b) => s + b.price, 0),
                bookings: dayBookings.length,
            });
        }
        return days;
    }, [confirmed]);

    const serviceData = useMemo(() => {
        const map: Record<string, number> = {};
        confirmed.forEach(b => { map[b.serviceName] = (map[b.serviceName] || 0) + 1; });
        return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    }, [confirmed]);

    const kpis = [
        { label: 'Total Bookings',    value: confirmed.length,             icon: <Calendar size={22} />,   color: '#8b5cf6' },
        { label: 'Total Revenue',     value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: '#10b981' },
        { label: 'Avg Booking Value', value: `$${avgValue}`,               icon: <TrendingUp size={22} />, color: '#f59e0b' },
        { label: 'Cancellation Rate', value: `${cancelRate}%`,             icon: <XCircle size={22} />,    color: '#ef4444' },
    ];

    return (
        <div className="fade-in">
            <div className="kpi-grid">
                {kpis.map(k => (
                    <div className="kpi-card" key={k.label}>
                        <div className="kpi-icon" style={{ background: `${k.color}22`, color: k.color }}>{k.icon}</div>
                        <div className="kpi-info"><span className="kpi-value">{k.value}</span><span className="kpi-label">{k.label}</span></div>
                    </div>
                ))}
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <h3>Revenue — Last 7 Days</h3>
                    {confirmed.length === 0 ? <div className="chart-empty">No bookings yet.</div> :
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue"  stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue ($)" />
                                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2}   dot={{ r: 3 }} name="Bookings" />
                            </LineChart>
                        </ResponsiveContainer>
                    }
                </div>
                <div className="chart-card">
                    <h3>Top Services</h3>
                    {serviceData.length === 0 ? <div className="chart-empty">No service data yet</div> :
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={serviceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Bookings" />
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// APPOINTMENTS TAB
// ---------------------------------------------------------
function AppointmentsTab({ rawAppointments, reload, getAccessTokenSilently, showToast }: any) {
    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Mark this appointment as ${newStatus}?`)) return;
        try {
            const token = await getAccessTokenSilently();
            await updateAppointment(id, { status: newStatus }, token);
            showToast(`Appointment marked as ${newStatus}`, 'success');
            reload();
        } catch (e) {
            showToast('Failed to update status', 'error');
        }
    };

    if (rawAppointments.length === 0) return <div className="chart-empty">No appointments found.</div>;

    return (
        <div className="recent-bookings-card fade-in">
            <h3>All Appointments</h3>
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
                        {rawAppointments.map((a: any) => (
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
                                        <button className="btn btn-sm btn-outline" onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}>
                                            <CheckCircle size={14}/> Complete
                                        </button>
                                    )}
                                    {a.status === 'COMPLETED' && <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Done</span>}
                                    {a.status === 'CANCELLED' && <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Cancelled</span>}
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
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
    );
}

// ---------------------------------------------------------
// SERVICES TAB
// ---------------------------------------------------------
function ServicesTab({ salon, reload, getAccessTokenSilently, showToast }: any) {
    const [editing, setEditing] = useState<any>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try {
            const token = await getAccessTokenSilently();
            await deleteSalonService(token, id);
            showToast('Service deleted', 'success');
            reload();
        } catch(e) {
            showToast('Failed to delete', 'error');
        }
    };

    return (
        <div className="fade-in">
            {editing ? (
                <ServiceForm 
                    service={editing.id ? editing : null} 
                    onCancel={() => setEditing(null)} 
                    onSuccess={() => { setEditing(null); reload(); }} 
                    getAccessTokenSilently={getAccessTokenSilently}
                    showToast={showToast}
                />
            ) : (
                <div className="recent-bookings-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>Services</h3>
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
                                    <td>${s.price}</td>
                                    <td>{s.duration} min</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => setEditing(s)}><Edit2 size={16}/></button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(s.id)}><Trash2 size={16}/></button>
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

function ServiceForm({ service, onCancel, onSuccess, getAccessTokenSilently, showToast }: any) {
    const [formData, setFormData] = useState(service || { name: '', category: 'Haircare', price: 0, duration: 30, description: '' });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = await getAccessTokenSilently();
            if (service?.id) {
                await updateSalonService(token, service.id, { ...formData, price: Number(formData.price), duration: Number(formData.duration) });
                showToast('Service updated', 'success');
            } else {
                await createSalonService(token, { ...formData, price: Number(formData.price), duration: Number(formData.duration) });
                showToast('Service created', 'success');
            }
            onSuccess();
        } catch(e) {
            showToast('Failed to save service', 'error');
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
                    <label>Price ($)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required min="0" />
                </div>
                <div className="form-group">
                    <label>Duration (mins)</label>
                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required min="5" />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}

// ---------------------------------------------------------
// STYLISTS TAB
// ---------------------------------------------------------
function StylistsTab({ salon, reload, getAccessTokenSilently, showToast }: any) {
    const [editing, setEditing] = useState<any>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this stylist?')) return;
        try {
            const token = await getAccessTokenSilently();
            await deleteSalonStylist(token, id);
            showToast('Stylist deleted', 'success');
            reload();
        } catch(e) {
            showToast('Failed to delete', 'error');
        }
    };

    return (
        <div className="fade-in">
            {editing ? (
                <StylistForm 
                    stylist={editing.id ? editing : null} 
                    onCancel={() => setEditing(null)} 
                    onSuccess={() => { setEditing(null); reload(); }} 
                    getAccessTokenSilently={getAccessTokenSilently}
                    showToast={showToast}
                />
            ) : (
                <div className="recent-bookings-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>Stylists</h3>
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
                                            <img src={s.image || 'https://via.placeholder.com/40'} alt="" style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover'}} />
                                            {s.name}
                                        </div>
                                    </td>
                                    <td>{s.role}</td>
                                    <td>{s.specialties?.join(', ') || '-'}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => setEditing(s)}><Edit2 size={16}/></button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(s.id)}><Trash2 size={16}/></button>
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

function StylistForm({ stylist, onCancel, onSuccess, getAccessTokenSilently, showToast }: any) {
    const [formData, setFormData] = useState(stylist || { name: '', role: '', image: '', specialtiesStr: '' });
    
    // Convert specialties array to string for editing
    useEffect(() => {
        if (stylist?.specialties) {
            setFormData((prev: any) => ({ ...prev, specialtiesStr: stylist.specialties.join(', ') }));
        }
    }, [stylist]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const specialties = formData.specialtiesStr.split(',').map((s: string) => s.trim()).filter(Boolean);
        const payload = { ...formData, specialties };
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
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}
