import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { mapApiSalonToFrontendSalon, type Salon } from '../data';
import { fetchSalonById, submitReview } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAuth0 } from '@auth0/auth0-react';
import { MapPin, Phone, Clock, Star, PenLine, X } from 'lucide-react';
import SalonMap from '../components/SalonMap';
import './SalonDetail.css';

export default function SalonDetail() {
    const { id } = useParams<{ id: string }>();
    const [salon, setSalon] = useState<Salon | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isLoggedIn, login: authLogin } = useAuth();
    const { showToast } = useToast();
    const { getAccessTokenSilently } = useAuth0();

    // Review form state
    const [showForm, setShowForm] = useState(false);
    const [hoverStar, setHoverStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const loadSalon = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await fetchSalonById(id);
                setSalon(mapApiSalonToFrontendSalon(data));
            } catch (err) {
                console.error("Failed to fetch salon:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSalon();
    }, [id]);

    const handleSubmitReview = async () => {
        if (!isLoggedIn) {
            showToast('Please log in to submit a review.', 'error');
            authLogin();
            return;
        }

        if (!selectedStar || !reviewText.trim()) {
            showToast('Please select a star rating and write a review.', 'error');
            return;
        }

        if (!id) return;

        setIsSubmittingReview(true);
        try {
            const token = await getAccessTokenSilently();
            await submitReview({
                salonId: id,
                rating: selectedStar,
                comment: reviewText.trim()
            }, token);

            showToast('Review submitted! Thank you 🌟', 'success');
            setShowForm(false);
            setSelectedStar(0);
            setHoverStar(0);
            setReviewText('');

            // Reload the salon details to fetch the new reviews from the database
            const data = await fetchSalonById(id);
            setSalon(mapApiSalonToFrontendSalon(data));
        } catch (err) {
            console.error("Failed to submit review:", err);
            showToast('Failed to submit review. Please try again.', 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const allReviews = salon?.reviews || [];

    if (isLoading) {
        return (
            <main className="salon-detail-page">
                <div className="global-loading-wrap">
                    <div className="global-spinner"></div>
                    <span className="global-loading-text">Loading salon details...</span>
                </div>
            </main>
        );
    }

    if (!salon) {
        return (
            <main className="salon-detail-page">
                <div className="container section" style={{ textAlign: 'center' }}>
                    <h2>Salon not found</h2>
                    <p>The salon you're looking for doesn't exist.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="salon-detail-page">
            {/* Hero */}
            <section className="salon-hero">
                <img src={salon.image} alt={salon.name} className="salon-hero-img" />
                <div className="salon-hero-overlay" />
                <div className="salon-hero-content container">
                    <span className="badge badge-rating">
                        <Star size={14} fill="currentColor" /> {salon.rating}
                    </span>
                    <h1>{salon.name}</h1>
                    <p className="salon-hero-location">
                        <MapPin size={18} /> {salon.location} • {salon.distance}
                    </p>
                </div>
            </section>

            <div className="container salon-detail-grid">
                {/* Main Content */}
                <div className="salon-main">
                    {/* About */}
                    <section className="detail-section">
                        <h3>About</h3>
                        <p>{salon.description}</p>
                    </section>

                    {/* Reviews */}
                    <section className="detail-section">
                        <h3>Reviews ({allReviews.length})</h3>

                        {/* Write a Review Toggle */}
                        <button
                            className="write-review-toggle"
                            onClick={() => setShowForm((p) => !p)}
                        >
                            {showForm ? <><X size={16} /> Cancel</> : <><PenLine size={16} /> Write a Review</>}
                        </button>

                        {/* Review Form */}
                        {showForm && (
                            <div className="review-form-card">
                                <h4>Your Review</h4>
                                <div className="star-picker">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star-btn ${star <= (hoverStar || selectedStar) ? 'filled' : ''}`}
                                            onMouseEnter={() => setHoverStar(star)}
                                            onMouseLeave={() => setHoverStar(0)}
                                            onClick={() => setSelectedStar(star)}
                                            aria-label={`Rate ${star} stars`}
                                            disabled={isSubmittingReview}
                                        >
                                            <Star size={24} fill={star <= (hoverStar || selectedStar) ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="review-textarea"
                                    placeholder="Share your experience with this salon…"
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    disabled={isSubmittingReview}
                                />
                                <div className="review-form-actions">
                                    <button className="btn btn-primary" onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                    <button className="btn btn-outline" onClick={() => setShowForm(false)} disabled={isSubmittingReview}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="reviews-list">
                            {allReviews.map((rev) => (
                                <div key={rev.id} className="review-card">
                                    <div className="review-header">
                                        <div className="review-avatar">
                                            {rev.avatar ? (
                                                <img src={rev.avatar} alt={rev.author} />
                                            ) : (
                                                rev.author.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <h4>{rev.author}</h4>
                                            <p className="review-date">{rev.date}</p>
                                        </div>
                                        <span className="review-rating">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={i} size={14} fill={i < rev.rating ? 'currentColor' : 'none'} />
                                            ))}
                                        </span>
                                    </div>
                                    <p className="review-text">{rev.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="salon-sidebar">
                    <div className="sidebar-card">
                        <h4>Contact Info</h4>
                        <div className="sidebar-info">
                            <p><MapPin size={16} /> {salon.location}</p>
                            <p><Phone size={16} /> {salon.phone}</p>
                            <p><Clock size={16} /> {salon.hours}</p>
                        </div>
                        <Link
                            to={`/booking?salon=${salon.id}`}
                            className="btn btn-primary sidebar-book-btn"
                        >
                            Book Appointment
                        </Link>
                    </div>

                    {/* Map */}
                    <div className="sidebar-card">
                        <h4>Location</h4>
                        <SalonMap
                            name={salon.name}
                            address={salon.address}
                            coordinates={salon.coordinates}
                            height={200}
                        />
                    </div>

                    <div className="sidebar-card">
                        <h4>Quick Stats</h4>
                        <div className="sidebar-stats">
                            <div className="stat">
                                <span className="stat-value">
                                    <Star size={18} fill="currentColor" /> {salon.rating}
                                </span>
                                <span className="stat-label">Rating</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{salon.reviewCount.toLocaleString()}</span>
                                <span className="stat-label">Reviews</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{salon.services.length}</span>
                                <span className="stat-label">Services</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
