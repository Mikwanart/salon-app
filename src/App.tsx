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
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function RouteScrollRestorer() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const { isEmailVerified } = useAuth();

  return (
    <>
      {!isEmailVerified && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '10px 16px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 500 }}>
          ⚠️ Please verify your email address to get full features. Check your inbox for the verification link.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
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
    </>
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

