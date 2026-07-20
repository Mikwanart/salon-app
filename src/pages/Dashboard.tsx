import { useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchMyAppointments } from '../lib/api';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, XCircle, BarChart2 } from 'lucide-react';
import './Dashboard.css';

interface RawBooking {
    id: string;
    salonName: string;
    serviceName: string;
    stylistName?: string;
    date: string;
    time: string;
    price: number;
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    customerName?: string;
}

export default function Dashboard() {
    const { getAccessTokenSilently } = useAuth0();
    const [rawBookings, setRawBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                const token = await getAccessTokenSilently();
                const data = await fetchMyAppointments(token);
                setRawBookings(data);
            } catch (err) {
                console.error("Failed to load appointments", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAppointments();
    }, [getAccessTokenSilently]);

    const bookings: RawBooking[] = useMemo(() => {
        return rawBookings.map((b: any) => {
            const dateObj = new Date(b.date);
            const dateStr = dateObj.toISOString().split('T')[0];
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

            return {
                id: b.id,
                salonName: b.salon?.name || 'Unknown Salon',
                serviceName: b.service?.name || 'Unknown Service',
                date: dateStr,
                time: timeStr,
                price: b.service?.price || 0,
                status: b.status?.toLowerCase(),
                paymentMethod: b.paymentMethod ? b.paymentMethod.toLowerCase() : 'cash',
                paymentStatus: b.paymentStatus || 'PENDING',
                customerName: 'You'
            };
        });
    }, [rawBookings]);

    const confirmed = bookings.filter(b => b.status !== 'cancelled');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.price || 0), 0);
    const avgValue = confirmed.length ? Math.round(totalRevenue / confirmed.length) : 0;
    const cancelRate = bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0;

    // Revenue over last 7 days
    const revenueData = useMemo(() => {
        const days: { label: string; revenue: number; bookings: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayBookings = confirmed.filter(b => b.date === dateStr);
            days.push({ label, revenue: dayBookings.reduce((s, b) => s + b.price, 0), bookings: dayBookings.length });
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
        { label: 'Total Bookings', value: confirmed.length, icon: <Calendar size={22} />, color: '#8b5cf6' },
        { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: '#10b981' },
        { label: 'Avg Booking Value', value: `$${avgValue}`, icon: <TrendingUp size={22} />, color: '#f59e0b' },
        { label: 'Cancellation Rate', value: `${cancelRate}%`, icon: <XCircle size={22} />, color: '#ef4444' },
    ];

    return (
        <main className="dashboard-page">
            <section className="dashboard-header">
                <div className="container">
                    <div className="dashboard-title-row">
                        <div>
                            <h1><BarChart2 size={28} /> Salon Dashboard</h1>
                            <p>Your business at a glance</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading your dashboard...</div>
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
                        {/* Revenue Line Chart */}
                        <div className="chart-card">
                            <h3>Revenue — Last 7 Days</h3>
                            {confirmed.length === 0 ? (
                                <div className="chart-empty">Make some bookings to see data here</div>
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
                                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue ($)" />
                                        <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Services Bar Chart */}
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
                        <h3>Recent Bookings</h3>
                        {bookings.length === 0 ? (
                            <div className="chart-empty">No bookings yet. Go book an appointment!</div>
                        ) : (
                            <div className="bookings-table-wrap">
                                <table className="bookings-table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Salon</th>
                                            <th>Service</th>
                                            <th>Date</th>
                                            <th>Price</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...bookings].reverse().slice(0, 10).map(b => (
                                            <tr key={b.id}>
                                                <td>{b.customerName || '—'}</td>
                                                <td>{b.salonName}</td>
                                                <td>{b.serviceName}</td>
                                                <td>{b.date} {b.time}</td>
                                                <td className="td-price">${b.price}</td>
                                                <td className="td-payment">
                                                    <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {b.paymentMethod === 'momo' ? '📱 MoMo' : 
                                                         b.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                                                    </span>
                                                    <span className={`badge-status ${b.paymentStatus?.toLowerCase()}`} style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', display: 'inline-block' }}>
                                                        {b.paymentStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${b.status === 'cancelled' ? 'cancelled' : b.status === 'rescheduled' ? 'rescheduled' : 'confirmed'}`}>
                                                        {b.status === 'cancelled' ? 'Cancelled' : b.status === 'rescheduled' ? 'Rescheduled' : 'Confirmed'}
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
