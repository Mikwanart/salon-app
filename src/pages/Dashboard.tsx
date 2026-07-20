import { useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchSalonOwnerAppointments, fetchSalonOwnerSalon } from '../lib/api';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, XCircle, BarChart2, MapPin, Phone } from 'lucide-react';
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
    const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([]);
    const [ownerSalon, setOwnerSalon] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const [appointments, salon] = await Promise.all([
                    fetchSalonOwnerAppointments(token),
                    fetchSalonOwnerSalon(token).catch(() => null), // non-fatal
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
        load();
    }, [getAccessTokenSilently]);

    const bookings = useMemo(() => {
        return rawAppointments.map((a) => {
            const dateObj = new Date(a.date);
            return {
                id: a.id,
                customerName: a.client?.name || 'Unknown',
                customerEmail: a.client?.email || '',
                salonName: a.salon?.name || 'Unknown Salon',
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

    // Revenue over last 7 days
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

    // Service breakdown
    const serviceData = useMemo(() => {
        const map: Record<string, number> = {};
        confirmed.forEach(b => {
            map[b.serviceName] = (map[b.serviceName] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [confirmed]);

    const kpis = [
        { label: 'Total Bookings',    value: confirmed.length,             icon: <Calendar size={22} />,   color: '#8b5cf6' },
        { label: 'Total Revenue',     value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: '#10b981' },
        { label: 'Avg Booking Value', value: `$${avgValue}`,               icon: <TrendingUp size={22} />, color: '#f59e0b' },
        { label: 'Cancellation Rate', value: `${cancelRate}%`,             icon: <XCircle size={22} />,    color: '#ef4444' },
    ];

    return (
        <main className="dashboard-page">
            <section className="dashboard-header">
                <div className="container">
                    <div className="dashboard-title-row">
                        <div>
                            <h1><BarChart2 size={28} /> Salon Dashboard</h1>
                            <p>
                                {ownerSalon
                                    ? `Managing: ${ownerSalon.name}`
                                    : 'Your business at a glance'}
                            </p>
                        </div>
                        {ownerSalon && (
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
                        )}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading your dashboard...</div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <BarChart2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <div className="kpi-grid">
                                {kpis.map(k => (
                                    <div className="kpi-card" key={k.label}>
                                        <div className="kpi-icon" style={{ background: `${k.color}22`, color: k.color }}>
                                            {k.icon}
                                        </div>
                                        <div className="kpi-info">
                                            <span className="kpi-value">{k.value}</span>
                                            <span className="kpi-label">{k.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="charts-row">
                                <div className="chart-card">
                                    <h3>Revenue — Last 7 Days</h3>
                                    {confirmed.length === 0 ? (
                                        <div className="chart-empty">No bookings yet — share your salon link to get started!</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="revenue"  stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue ($)" />
                                                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2}   dot={{ r: 3 }} name="Bookings" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                <div className="chart-card">
                                    <h3>Top Services</h3>
                                    {serviceData.length === 0 ? (
                                        <div className="chart-empty">No service data yet</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={serviceData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                                                />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Bookings" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Recent Bookings Table */}
                            <div className="recent-bookings-card">
                                <h3>Customer Bookings <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({bookings.length} total)</span></h3>
                                {bookings.length === 0 ? (
                                    <div className="chart-empty">No customer bookings yet.</div>
                                ) : (
                                    <div className="bookings-table-wrap">
                                        <table className="bookings-table">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Service</th>
                                                    <th>Stylist</th>
                                                    <th>Date & Time</th>
                                                    <th>Price</th>
                                                    <th>Payment</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookings.slice(0, 20).map(b => (
                                                    <tr key={b.id}>
                                                        <td>
                                                            <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.customerEmail}</div>
                                                        </td>
                                                        <td>
                                                            <div>{b.serviceName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.serviceCategory}</div>
                                                        </td>
                                                        <td>{b.stylistName}</td>
                                                        <td>{b.date} {b.time}</td>
                                                        <td className="td-price">${b.price}</td>
                                                        <td className="td-payment">
                                                            <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {b.paymentMethod === 'momo' ? '📱 MoMo' :
                                                                 b.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                                                            </span>
                                                            <span className={`badge-status ${b.paymentStatus?.toLowerCase()}`} style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', display: 'inline-block' }}>
                                                                {b.paymentStatus}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${b.status === 'cancelled' ? 'cancelled' : b.status === 'rescheduled' ? 'rescheduled' : b.status === 'completed' ? 'completed' : 'confirmed'}`}>
                                                                {b.status === 'cancelled'   ? 'Cancelled'   :
                                                                 b.status === 'rescheduled' ? 'Rescheduled' :
                                                                 b.status === 'completed'   ? 'Completed'   : 'Confirmed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
