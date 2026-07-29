import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth0 } from '@auth0/auth0-react';
import { updateAppointment } from '../lib/api';
import { Scissors, User, Sun, Moon, Bell, LayoutDashboard, X, CheckCheck, ShieldCheck, ChevronRight, ArrowRight } from 'lucide-react';
import './Navbar.css';
import './NavbarExtensions.css';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const { user, isLoggedIn, login, isSalonOwner, isAdmin } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const { showToast } = useToast();
    const { isDark, toggle } = useTheme();
    const { notifications, unreadCount, markAllRead, clearAll, updateNotificationActionStatus } = useNotifications();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    // Close bell dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const handleBellOpen = () => {
        setBellOpen(prev => !prev);
        if (!bellOpen) markAllRead();
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const typeIcon: Record<string, string> = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
    };

    const handleNotificationAction = async (notif: any, action: 'CONFIRMED' | 'CANCELLED') => {
        if (!notif.appointmentId) return;
        try {
            const token = await getAccessTokenSilently();
            await updateAppointment(notif.appointmentId, { status: action }, token);
            updateNotificationActionStatus(notif.appointmentId, action);
            showToast(`Appointment ${action === 'CONFIRMED' ? 'Accepted' : 'Declined'}`, action === 'CONFIRMED' ? 'success' : 'info');
        } catch (e) {
            showToast('Failed to update appointment status', 'error');
        }
    };

    const renderNotificationBell = () => (
        <div className="bell-wrapper" ref={bellRef}>
            <button
                className="bell-btn"
                onClick={handleBellOpen}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {bellOpen && (
                <div className="bell-dropdown">
                    <div className="bell-dropdown-header">
                        <span>Notifications</span>
                        <div className="bell-header-actions">
                            {notifications.length > 0 && (
                                <>
                                    <button onClick={markAllRead} title="Mark all read"><CheckCheck size={15} /></button>
                                    <button onClick={clearAll} title="Clear all"><X size={15} /></button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bell-dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="bell-empty">
                                <Bell size={28} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(n => (
                                <div key={n.id} className={`bell-notif ${n.read ? '' : 'unread'}`}>
                                    <span className="notif-type-icon">{typeIcon[n.type] || 'ℹ️'}</span>
                                    <div className="notif-body">
                                        <p className="notif-msg">{n.message}</p>
                                        <span className="notif-time">{formatTime(n.timestamp)}</span>
                                        {n.actions && n.actions.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ backgroundColor: '#10b981', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                    onClick={() => handleNotificationAction(n, 'CONFIRMED')}
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                    onClick={() => handleNotificationAction(n, 'CANCELLED')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-brand">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--primary)', color: '#fff', borderRadius: '10px' }}>
                        <Scissors size={20} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <span className="brand-text">SalonBook</span>
                </Link>

                {/* DESKTOP NAVIGATION LINKS */}
                <div className="navbar-links desktop-only-links">
                    <Link
                        to="/services"
                        className={`nav-link ${isActive('/services') ? 'active' : ''}`}
                    >
                        Find Services
                    </Link>

                    <Link
                        to="/about"
                        className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                    >
                        About
                    </Link>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                            style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            <ShieldCheck size={16} /> Admin Panel
                        </Link>
                    )}
                </div>

                {/* DESKTOP NAVIGATION ACTIONS */}
                <div className="navbar-actions desktop-only-actions">
                    {isLoggedIn && renderNotificationBell()}

                    <button
                        className="theme-toggle"
                        onClick={toggle}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {isLoggedIn ? (
                        <div className="nav-user">
                            <Link to="/profile" className="nav-profile-link">
                                <div className="nav-avatar">
                                    {user?.avatar ? <img src={user.avatar} alt="" /> : <User size={20} />}
                                </div>
                                <span className="nav-user-name">{user?.name}</span>
                            </Link>
                            {isSalonOwner && (
                                <Link to="/dashboard" className="nav-dashboard-link" title="Owner Dashboard">
                                    <LayoutDashboard size={18} />
                                </Link>
                            )}
                            {isAdmin && (
                                <Link to="/admin" className="nav-dashboard-link" title="Admin Control Panel" style={{ color: 'var(--primary)' }}>
                                    <ShieldCheck size={18} />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <button className="nav-login" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => login()}>
                                Login
                            </button>
                            <Link to="/booking" className="btn btn-primary nav-book">
                                Book Now
                            </Link>
                        </>
                    )}
                </div>

                {/* MOBILE CONTROLS & TRIPLE DASHED HAMBURGER BUTTON (MOBILE ONLY) */}
                <div className="mobile-header-right">
                    {isLoggedIn && renderNotificationBell()}
                    <button
                        className={`hamburger ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* FRESHA-STYLE FULLSCREEN MOBILE MENU OVERLAY (MOUNTED TO BODY VIA PORTAL) */}
            {menuOpen && createPortal(
                <div className="fresha-mobile-menu">
                    <div className="fresha-mobile-header">
                        <button className="fresha-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="fresha-mobile-content">
                        <h2 className="fresha-heading">{isLoggedIn ? `Hello, ${user?.name?.split(' ')[0] || 'User'}` : 'For customers'}</h2>

                        {/* Customer Options Card */}
                        <div className="fresha-card">
                            {!isLoggedIn ? (
                                <button className="fresha-row primary-text" onClick={() => { setMenuOpen(false); login(); }}>
                                    <span>Log in or sign up</span>
                                    <ChevronRight size={20} className="fresha-chevron" />
                                </button>
                            ) : (
                                <>
                                    <Link to="/profile" className="fresha-row primary-text" onClick={() => setMenuOpen(false)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="nav-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                                {user?.avatar ? <img src={user.avatar} alt="" /> : <User size={16} />}
                                            </div>
                                            <span>My Profile</span>
                                        </div>
                                        <ChevronRight size={20} className="fresha-chevron" />
                                    </Link>

                                    <button className="fresha-row" onClick={() => { setMenuOpen(false); handleBellOpen(); }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Bell size={18} />
                                            <span>Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="bell-badge" style={{ position: 'relative', top: 0, right: 0 }}>
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </span>
                                        <ChevronRight size={20} className="fresha-chevron" />
                                    </button>
                                </>
                            )}

                            <Link to="/services" className="fresha-row" onClick={() => setMenuOpen(false)}>
                                <span>Find Services</span>
                                <ChevronRight size={20} className="fresha-chevron" />
                            </Link>

                            <Link to="/about" className="fresha-row" onClick={() => setMenuOpen(false)}>
                                <span>About us</span>
                                <ChevronRight size={20} className="fresha-chevron" />
                            </Link>

                            <button className="fresha-row" onClick={toggle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                                    {isDark ? 'Light mode' : 'Dark mode'}
                                </span>
                                <ChevronRight size={20} className="fresha-chevron" />
                            </button>
                        </div>

                        {/* Business / Account Card */}
                        <div className="fresha-card">


                            {isLoggedIn && isSalonOwner && (
                                <Link to="/dashboard" className="fresha-row font-medium" onClick={() => setMenuOpen(false)}>
                                    <span>Salon Owner Dashboard</span>
                                    <ArrowRight size={22} className="fresha-arrow" />
                                </Link>
                            )}

                            {isLoggedIn && isAdmin && (
                                <Link to="/admin" className="fresha-row font-medium" style={{ color: 'var(--primary)' }} onClick={() => setMenuOpen(false)}>
                                    <span>Admin Panel</span>
                                    <ArrowRight size={22} className="fresha-arrow" />
                                </Link>
                            )}

                        </div>
                    </div>
                </div>,
                document.body
            )}
        </nav>
    );
}
