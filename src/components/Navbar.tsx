import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Scissors, User, LogOut, Sun, Moon, Bell, LayoutDashboard, X, CheckCheck } from 'lucide-react';
import './Navbar.css';
import './NavbarExtensions.css';


export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const { user, isLoggedIn, login, logout } = useAuth();
    const { showToast } = useToast();
    const { isDark, toggle } = useTheme();
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        showToast('You have been logged out', 'info');
    };

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

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">
                        <Scissors size={24} />
                    </span>
                    <span className="brand-text">SalonBook</span>
                </Link>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <Link
                        to="/services"
                        className={`nav-link ${isActive('/services') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        Find Services
                    </Link>
                    <Link
                        to="/for-salons"
                        className={`nav-link ${isActive('/for-salons') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        For Salons
                    </Link>
                    <Link
                        to="/about"
                        className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        About
                    </Link>
                </div>

                <div className="navbar-actions">
                    {/* Notification Bell */}
                    {isLoggedIn && (
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
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        className="theme-toggle"
                        onClick={toggle}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {isLoggedIn ? (
                        <div className="nav-user">
                            <Link to="/profile" className="nav-profile-link" onClick={() => setMenuOpen(false)}>
                                <div className="nav-avatar">
                                    {user?.avatar ? <img src={user.avatar} alt="" /> : <User size={20} />}
                                </div>
                                <span className="nav-user-name">{user?.name}</span>
                            </Link>
                            <Link to="/dashboard" className="nav-dashboard-link" title="Dashboard" onClick={() => setMenuOpen(false)}>
                                <LayoutDashboard size={18} />
                            </Link>
                            <button onClick={handleLogout} className="nav-login">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <button className="nav-login" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => { setMenuOpen(false); login(); }}>
                                Login
                            </button>
                            <Link to="/booking" className="btn btn-primary nav-book" onClick={() => setMenuOpen(false)}>
                                Book Now
                            </Link>
                        </>
                    )}
                </div>

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
        </nav>
    );
}
