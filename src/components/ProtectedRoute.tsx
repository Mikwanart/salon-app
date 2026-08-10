import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isLoggedIn, openRolePicker, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            openRolePicker();
        }
    }, [isLoading, isLoggedIn, openRolePicker]);

    if (isLoading || !isLoggedIn) {
        return (
            <div className="global-loading-wrap" style={{ minHeight: '60vh' }}>
                <div className="global-spinner"></div>
                <span className="global-loading-text">Redirecting to secure login...</span>
            </div>
        );
    }

    return <>{children}</>;
}
