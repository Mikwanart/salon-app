import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  ShieldCheck,
  DollarSign,
  Scissors,
  Users,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminSalons,
  updateSalonStatus,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminAppointments,
} from '../lib/api';
import { useToast } from '../context/ToastContext';
import './AdminDashboard.css';

type TabType = 'overview' | 'salons' | 'users' | 'appointments';

export default function AdminDashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState<any>(null);

  // Salons State
  const [salons, setSalons] = useState<any[]>([]);
  const [salonStatusFilter, setSalonStatusFilter] = useState('ALL');
  const [salonSearch, setSalonSearch] = useState('');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Appointments State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('ALL');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'salons') loadSalons();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'appointments') loadAppointments();
  }, [activeTab, salonStatusFilter, salonSearch, userRoleFilter, userSearch, appointmentStatusFilter, appointmentSearch]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const data = await fetchAdminStats(token);
      setStats(data);
    } catch (err) {
      console.error('Error loading admin stats:', err);
      showToast('Failed to load admin statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSalons = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetchAdminSalons(token, salonStatusFilter, salonSearch);
      setSalons(res.data || []);
    } catch (err) {
      console.error('Error loading salons:', err);
      showToast('Failed to load salons list', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetchAdminUsers(token, userRoleFilter, userSearch);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Failed to load users list', 'error');
    }
  };

  const loadAppointments = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetchAdminAppointments(token, appointmentStatusFilter, appointmentSearch);
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
      showToast('Failed to load appointments list', 'error');
    }
  };

  const handleUpdateSalonStatus = async (id: string, newStatus: string) => {
    try {
      const token = await getAccessTokenSilently();
      await updateSalonStatus(token, id, newStatus);
      showToast(`Salon status updated to ${newStatus}`, 'success');
      loadSalons();
      loadStats();
    } catch (err) {
      console.error('Error updating salon status:', err);
      showToast('Failed to update salon status', 'error');
    }
  };

  const handleUpdateUserRole = async (id: string, newRole: string) => {
    try {
      const token = await getAccessTokenSilently();
      await updateUserRole(token, id, newRole);
      showToast(`User role updated to ${newRole}`, 'success');
      loadUsers();
      loadStats();
    } catch (err) {
      console.error('Error updating user role:', err);
      showToast('Failed to update user role', 'error');
    }
  };

  return (
    <div className="admin-page">
      {/* Header Banner */}
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <div className="admin-title-badge">
                <ShieldCheck size={16} /> Super-Admin Control Panel
              </div>
              <h1>Platform Management & Analytics</h1>
              <p>Monitor metrics, verify registered salons, manage accounts, and oversee bookings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Tab Controls */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={18} /> Overview
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'salons' ? 'active' : ''}`}
            onClick={() => setActiveTab('salons')}
          >
            <Scissors size={18} /> Salons
            {stats?.salons?.pending > 0 && (
              <span className="admin-tab-count">{stats.salons.pending} Pending</span>
            )}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Users ({stats?.users?.total || 0})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} /> Global Bookings ({stats?.appointments?.total || 0})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>Loading platform metrics...</div>
            ) : (
              <>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="stat-icon-box emerald">
                      <DollarSign size={26} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-num">${(stats?.financials?.totalRevenue || 0).toLocaleString()}</div>
                      <div className="stat-desc">Total Platform Revenue</div>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box pink">
                      <Scissors size={26} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-num">{stats?.salons?.approved || 0}</div>
                      <div className="stat-desc">Active Approved Salons ({stats?.salons?.pending || 0} Pending)</div>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box purple">
                      <Users size={26} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-num">{stats?.users?.total || 0}</div>
                      <div className="stat-desc">Registered Accounts ({stats?.users?.owners || 0} Owners)</div>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box amber">
                      <Calendar size={26} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-num">{stats?.appointments?.total || 0}</div>
                      <div className="stat-desc">Total Appointments ({stats?.appointments?.completed || 0} Completed)</div>
                    </div>
                  </div>
                </div>

                {/* System Summary Card */}
                <div className="admin-summary-card">
                  <h3 style={{ marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} style={{ color: 'var(--primary)' }} /> Quick Status & Alerts
                  </h3>
                  <div className="summary-grid">
                    <div className="summary-box">
                      <div className="summary-box-title">
                        <Clock size={16} /> Pending Salon Approvals
                      </div>
                      <div className="summary-box-val" style={{ color: stats?.salons?.pending > 0 ? '#f59e0b' : '#10b981' }}>
                        {stats?.salons?.pending || 0} Awaiting Review
                      </div>
                    </div>

                    <div className="summary-box">
                      <div className="summary-box-title">
                        <UserCheck size={16} /> System User Breakdown
                      </div>
                      <div className="summary-box-val" style={{ color: 'var(--primary)' }}>
                        {stats?.users?.clients || 0} Clients / {stats?.users?.owners || 0} Owners / {stats?.users?.admins || 0} Admins
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Salons Management Tab */}
        {activeTab === 'salons' && (
          <div>
            <div className="admin-toolbar">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search salons by name, city, email..."
                  value={salonSearch}
                  onChange={(e) => setSalonSearch(e.target.value)}
                />
              </div>
              <div className="admin-filter-group">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    className={`admin-filter-btn ${salonStatusFilter === st ? 'active' : ''}`}
                    onClick={() => setSalonStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Salon Name</th>
                    <th>City / Address</th>
                    <th>Owner Contact</th>
                    <th>Status</th>
                    <th>Services / Staff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salons.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No salons match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    salons.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={16} style={{ color: 'var(--primary)' }} /> {s.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.email || 'No email provided'}</div>
                        </td>
                        <td>
                          <div>{s.city}, {s.state}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.address}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{s.owner?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.owner?.email}</div>
                        </td>
                        <td>
                          <span className={`badge-status ${s.status?.toLowerCase() || 'approved'}`}>
                            {s.status === 'APPROVED' && <CheckCircle2 size={12} />}
                            {s.status === 'PENDING' && <AlertTriangle size={12} />}
                            {s.status === 'REJECTED' && <XCircle size={12} />}
                            {s.status || 'APPROVED'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {s._count?.services || 0} Services • {s._count?.stylists || 0} Stylists
                          </div>
                        </td>
                        <td>
                          <div className="btn-action-group">
                            {s.status !== 'APPROVED' && (
                              <button
                                className="btn-admin-approve"
                                onClick={() => handleUpdateSalonStatus(s.id, 'APPROVED')}
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                            )}
                            {s.status !== 'REJECTED' && (
                              <button
                                className="btn-admin-reject"
                                onClick={() => handleUpdateSalonStatus(s.id, 'REJECTED')}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Role Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="admin-toolbar">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="admin-filter-group">
                {['ALL', 'CLIENT', 'SALON_OWNER', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    className={`admin-filter-btn ${userRoleFilter === r ? 'active' : ''}`}
                    onClick={() => setUserRoleFilter(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Bookings / Salons</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone || 'No phone'}</div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge-status ${u.role?.toLowerCase() || 'client'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {u._count?.bookings || 0} Bookings • {u._count?.salons || 0} Salons
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-role-select"
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          >
                            <option value="CLIENT">CLIENT</option>
                            <option value="SALON_OWNER">SALON_OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="admin-toolbar">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by client, salon, or service..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                />
              </div>
              <div className="admin-filter-group">
                {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    className={`admin-filter-btn ${appointmentStatusFilter === st ? 'active' : ''}`}
                    onClick={() => setAppointmentStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Salon & Service</th>
                    <th>Stylist</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No appointments found matching filter.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{new Date(app.date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{app.client?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.client?.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{app.salon?.name}</div>
                          <div style={{ fontSize: '0.85rem' }}>{app.service?.name}</div>
                        </td>
                        <td>{app.stylist?.name || 'Any Stylist'}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>
                          ${app.service?.price || 0}
                        </td>
                        <td>
                          <span className={`badge-status ${app.status?.toLowerCase() || 'pending'}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
