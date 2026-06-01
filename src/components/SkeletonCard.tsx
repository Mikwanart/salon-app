import './Toast.css';

export default function SkeletonCard({ variant = 'salon' }: { variant?: 'salon' | 'service' }) {
    if (variant === 'service') {
        return (
            <div className="skeleton-card">
                <div className="skeleton skeleton-img" style={{ height: 160 }} />
                <div className="skeleton-body">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-badge" />
                </div>
            </div>
        );
    }

    return (
        <div className="skeleton-card">
            <div className="skeleton skeleton-img" />
            <div className="skeleton-body">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line-short" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div className="skeleton skeleton-badge" />
                    <div className="skeleton" style={{ height: 14, width: 60 }} />
                </div>
            </div>
        </div>
    );
}
