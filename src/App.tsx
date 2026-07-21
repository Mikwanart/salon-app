import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import SalonDetail from './pages/SalonDetail';
import Booking from './pages/Booking';
import About from './pages/About';
import ForSalons from './pages/ForSalons';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function RouteScrollRestorer() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const { isEmailVerified, logout } = useAuth();

  if (!isEmailVerified) {
    return (
      <div className="section container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Please Verify Your Email</h2>
        <p style={{ maxWidth: '500px', margin: '0 auto 32px', color: 'var(--text-secondary)' }}>
          We've sent a verification link to your email address. Please click the link to verify your account before accessing the platform.
        </p>
        <button onClick={logout} className="btn btn-primary">Sign Out</button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/salon/:id" element={<SalonDetail />} />
      <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
      <Route path="/about" element={<About />} />
      <Route path="/for-salons" element={<ForSalons />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<RoleProtectedRoute role="salon_owner"><Dashboard /></RoleProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RouteScrollRestorer />
      <Navbar />
      <ScrollToTop />
      <AppContent />
      <Footer />
    </BrowserRouter>
  );
}

export default App;

