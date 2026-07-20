import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
    children: ReactNode;
    role: string;
}

export default function RoleProtectedRoute({ children, role }: RoleProtectedRouteProps) {
    const { isLoggedIn, isLoading, login, roles } = useAuth();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            login();
        }
    }, [isLoading, isLoggedIn, login]);

    if (isLoading || !isLoggedIn) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Redirecting to secure login...</div>;
    }

    // User is logged in but doesn't have the required role
    if (!roles.includes(role)) {
        return (
            <div style={{
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                padding: '2rem',
            }}>
                <div style={{ fontSize: '4rem' }}>🔒</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Access Denied</h1>
                <p style={{ color: '#666', maxWidth: '400px', margin: 0 }}>
                    This page is only available to <strong>salon owners</strong>.
                    If you manage a salon and believe this is a mistake, please contact support.
                </p>
                <Link
                    to="/"
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem 2rem',
                        background: 'linear-gradient(135deg, #c9a96e, #a07840)',
                        color: '#fff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
