import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
    return (
        <main className="notfound-page">
            <div className="notfound-inner container">
                <div className="notfound-code">404</div>
                <h1>Page not found</h1>
                <p>The page you're looking for doesn't exist or has been moved.</p>
                <div className="notfound-actions">
                    <Link to="/" className="btn btn-primary">
                        <Home size={18} /> Go Home
                    </Link>
                    <Link to="/services" className="btn btn-outline">
                        <Search size={18} /> Browse Services
                    </Link>
                </div>
            </div>
        </main>
    );
}
