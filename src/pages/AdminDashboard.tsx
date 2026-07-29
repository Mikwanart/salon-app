import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  Store,
  Users,
  Calendar,
  Search,
  Bell,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Building,
  AlertTriangle,
  LogOut,
  Scissors,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminSalons,
  updateSalonStatus,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminAppointments,
} from '../lib/api';

import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useToast } from '../context/ToastContext';
import './AdminDashboard.css';

type TabType = 'overview' | 'salons' | 'users' | 'appointments';

export default function AdminDashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

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
    if (activeTab === 'salons' || activeTab === 'overview') loadSalons();
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
      setTabLoading(true);
      const token = await getAccessTokenSilently();
      const res = await fetchAdminSalons(token, salonStatusFilter, salonSearch);
      setSalons(res.data || []);
    } catch (err) {
      console.error('Error loading salons:', err);
      showToast('Failed to load salons list', 'error');
    } finally {
      setTabLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setTabLoading(true);
      const token = await getAccessTokenSilently();
      const res = await fetchAdminUsers(token, userRoleFilter, userSearch);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Failed to load users list', 'error');
    } finally {
      setTabLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setTabLoading(true);
      const token = await getAccessTokenSilently();
      const res = await fetchAdminAppointments(token, appointmentStatusFilter, appointmentSearch);
      const rawApps = res.data || [];
      const sortedApps = [...rawApps].sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });
      setAppointments(sortedApps);
    } catch (err) {
      console.error('Error loading appointments:', err);
      showToast('Failed to load appointments list', 'error');
    } finally {
      setTabLoading(false);
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

  // Avatar image fallback matching screenshot
  const adminAvatar = user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200";

  return (
    <div className="admin-console-layout">
      {/* LEFT SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--primary)', color: '#fff', borderRadius: '10px', flexShrink: 0 }}>
              <Scissors size={20} style={{ transform: 'rotate(-45deg)' }} />
            </div>
            <div>
              <h2 className="admin-logo-title" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)', margin: 0, lineHeight: 1.1 }}>SalonBook</h2>
              <p className="admin-logo-subtitle" style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Admin Console</p>
            </div>
          </Link>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutGrid size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'salons' ? 'active' : ''}`}
            onClick={() => setActiveTab('salons')}
          >
            <Store size={18} />
            <span>Salons</span>
            {stats?.salons?.pending > 0 && (
              <span className="nav-badge-count">{stats.salons.pending}</span>
            )}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} />
            <span>Bookings</span>
          </button>


        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="sidebar-exit-btn">
            <LogOut size={16} />
            <span>Exit Console</span>
          </Link>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="admin-main">
        {/* TOP HEADER BAR */}
        <header className="admin-topbar">
          {activeTab === 'overview' ? (
            <div className="admin-header-title-section">
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Manage salons, user accounts, and bookings in one place.
              </p>
            </div>
          ) : (
            <div></div>
          )}

          <div className="admin-topbar-actions">
            <button className="topbar-icon-btn" title="Notifications">
              <Bell size={20} />
              <span className="notif-dot"></span>
            </button>

            <button className="topbar-icon-btn" title="Help">
              <HelpCircle size={20} />
            </button>

            <div className="topbar-divider"></div>

            <div className="admin-profile-badge">
              <div className="profile-text">
                <span className="profile-name">{user?.name || 'Admin User'}</span>
                <span className="profile-role">Administrator</span>
              </div>
              <img src={adminAvatar} alt="Admin User" className="profile-avatar" />
            </div>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <div className="admin-body">



          {/* TAB CONTENT VIEWS */}
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              {loading ? (
                <div className="global-loading-wrap" style={{ height: '300px' }}>
                  <div className="global-spinner"></div>
                  <span className="global-loading-text">Loading platform metrics...</span>
                </div>
              ) : (
                <AnalyticsDashboard stats={stats} salons={salons} />
              )}
            </div>
          )}

          {/* SALONS TAB */}
          {activeTab === 'salons' && (
            <div className="admin-tab-content">
              <div className="admin-table-toolbar">
                <div className="toolbar-search">
                  <Search size={18} className="search-icon-muted" />
                  <input
                    type="text"
                    placeholder="Search salons by name, city, email..."
                    value={salonSearch}
                    onChange={(e) => setSalonSearch(e.target.value)}
                  />
                </div>
                <div className="toolbar-filters">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      className={`filter-pill ${salonStatusFilter === st ? 'active' : ''}`}
                      onClick={() => setSalonStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                  {tabLoading && <div className="global-spinner small" style={{ alignSelf: 'center', marginLeft: '6px' }}></div>}
                </div>
              </div>

              <div className="admin-table-card">
                {tabLoading ? (
                  <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Filtering salons...</span>
                  </div>
                ) : (
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Salon Name</th>
                        <th>Location</th>
                        <th>Owner Contact</th>
                        <th>Status</th>
                        <th>Services & Staff</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salons.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-table-cell">
                            No salons match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        salons.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <div className="table-bold-title">
                                <Building size={16} className="table-icon-primary" /> {s.name}
                              </div>
                              <div className="table-subtext">{s.email || 'No email provided'}</div>
                            </td>
                            <td>
                              <div>{s.city}, {s.state}</div>
                              <div className="table-subtext">{s.address}</div>
                            </td>
                            <td>
                              <div className="table-medium-text">{s.owner?.name || 'N/A'}</div>
                              <div className="table-subtext">{s.owner?.email}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${s.status?.toLowerCase() || 'approved'}`}>
                                {s.status === 'APPROVED' && <CheckCircle2 size={12} />}
                                {s.status === 'PENDING' && <AlertTriangle size={12} />}
                                {s.status === 'REJECTED' && <XCircle size={12} />}
                                {s.status || 'APPROVED'}
                              </span>
                            </td>
                            <td>
                              <div className="table-subtext">
                                {s._count?.services || 0} Services • {s._count?.stylists || 0} Stylists
                              </div>
                            </td>
                            <td>
                              <div className="action-btn-group">
                                {s.status !== 'APPROVED' && (
                                  <button
                                    className="btn-approve"
                                    onClick={() => handleUpdateSalonStatus(s.id, 'APPROVED')}
                                  >
                                    <CheckCircle2 size={14} /> Approve
                                  </button>
                                )}
                                {s.status !== 'REJECTED' && (
                                  <button
                                    className="btn-reject"
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
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="admin-tab-content">
              <div className="admin-table-toolbar">
                <div className="toolbar-search">
                  <Search size={18} className="search-icon-muted" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="toolbar-filters">
                  {['ALL', 'CLIENT', 'SALON_OWNER', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      className={`filter-pill ${userRoleFilter === r ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter(r)}
                    >
                      {r}
                    </button>
                  ))}
                  {tabLoading && <div className="global-spinner small" style={{ alignSelf: 'center', marginLeft: '6px' }}></div>}
                </div>
              </div>

              <div className="admin-table-card">
                {tabLoading ? (
                  <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Filtering users...</span>
                  </div>
                ) : (
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Current Role</th>
                        <th>Activity Stats</th>
                        <th>Change Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-table-cell">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="table-bold-title">{u.name}</div>
                              <div className="table-subtext">{u.phone || 'No phone'}</div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`status-pill ${u.role?.toLowerCase() || 'client'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <div className="table-subtext">
                                {u._count?.bookings || 0} Bookings • {u._count?.salons || 0} Salons
                              </div>
                            </td>
                            <td>
                              <select
                                className="role-dropdown"
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
                )}
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="admin-tab-content">
              <div className="admin-table-toolbar">
                <div className="toolbar-search">
                  <Search size={18} className="search-icon-muted" />
                  <input
                    type="text"
                    placeholder="Search by client, salon, or service..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                  />
                </div>
                <div className="toolbar-filters">
                  {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      className={`filter-pill ${appointmentStatusFilter === st ? 'active' : ''}`}
                      onClick={() => setAppointmentStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                  {tabLoading && <div className="global-spinner small" style={{ alignSelf: 'center', marginLeft: '6px' }}></div>}
                </div>
              </div>

              <div className="admin-table-card">
                {tabLoading ? (
                  <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Filtering bookings...</span>
                  </div>
                ) : (
                  <table className="admin-data-table">
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
                          <td colSpan={6} className="empty-table-cell">
                            No appointments found matching filter.
                          </td>
                        </tr>
                      ) : (
                        appointments.map((app) => (
                          <tr key={app.id}>
                            <td>
                              <div className="table-bold-title">{new Date(app.date).toLocaleDateString()}</div>
                              <div className="table-subtext">
                                {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <div className="table-medium-text">{app.client?.name || 'Unknown'}</div>
                              <div className="table-subtext">{app.client?.email}</div>
                            </td>
                            <td>
                              <div className="table-bold-title primary-color">{app.salon?.name}</div>
                              <div className="table-subtext">{app.service?.name}</div>
                            </td>
                            <td>{app.stylist?.name || 'Any Stylist'}</td>
                            <td>
                              <span className="price-tag">GH₵{app.service?.price || 0}</span>
                            </td>
                            <td>
                              <span className={`status-pill ${app.status?.toLowerCase() || 'pending'}`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
