import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Home from './pages/Home';
import SalonOwnerLanding from './pages/SalonOwnerLanding';
import AdminLanding from './pages/AdminLanding';
import Services from './pages/Services';
import SalonDetail from './pages/SalonDetail';
import Booking from './pages/Booking';
import About from './pages/About';
import ForSalons from './pages/ForSalons';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function RouteScrollRestorer() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** Shown on "/" while auth is resolving — prevents the wrong landing page flashing in */
function HomeSkeleton() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0a0719 0%, #1e0a32 50%, #0a0719 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'hsk-fade-in 0.15s ease both',
    }}>
      <style>{`
        @keyframes hsk-fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes hsk-pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
        .hsk-dot { width:8px; height:8px; border-radius:50%; background:#7B2040; animation: hsk-pulse 1.2s ease-in-out infinite; }
        .hsk-dot:nth-child(2) { animation-delay:0.2s }
        .hsk-dot:nth-child(3) { animation-delay:0.4s }
      `}</style>
      <div style={{ display:'flex', gap:'10px' }}>
        <div className="hsk-dot" />
        <div className="hsk-dot" />
        <div className="hsk-dot" />
      </div>
    </div>
  );
}

function MainLayout() {
  const { isEmailVerified, isSalonOwner, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isProfilePage = location.pathname.startsWith('/profile');
  const hideNavFooter = isAdminPage || isDashboardPage || isProfilePage;

  return (
    <>
      <RouteScrollRestorer />
      {!hideNavFooter && <Navbar />}
      <ScrollToTop />
      {!isEmailVerified && !hideNavFooter && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '10px 16px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 500 }}>
          ⚠️ Please verify your email address to get full features. Check your inbox for the verification link.
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            isLoading
              ? <HomeSkeleton />
              : isAdmin
                ? <AdminLanding />
                : isSalonOwner
                  ? <SalonOwnerLanding />
                  : <Home />
          }
        />
        <Route path="/services" element={<Services />} />
        <Route path="/salon/:id" element={<SalonDetail />} />
        <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/for-salons" element={<ForSalons />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<RoleProtectedRoute role="salon_owner"><Dashboard /></RoleProtectedRoute>} />
        <Route path="/admin" element={<RoleProtectedRoute role="admin"><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNavFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;

