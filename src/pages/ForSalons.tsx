import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Store, MapPin, Phone, Lock, Upload, Users, Calendar, TrendingUp } from 'lucide-react';
import { registerSalon } from '../lib/api';
import './ForSalons.css';

const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                reject(new Error('Canvas context failed'));
            }
        };
        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(file);
    });
};

export default function ForSalons() {
    const { isAuthenticated, getAccessTokenSilently, loginWithPopup } = useAuth0();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        tagline: '', 
        story: '', 
        address: '', 
        city: '', 
        state: '', 
        phone: '' 
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (step === 1) {
            if (!formData.name) {
                alert('Please enter a salon name');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.address || !formData.city || !formData.state || !formData.phone) {
                alert('Please fill out all location fields');
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!isAuthenticated) {
                try {
                    await loginWithPopup();
                } catch (err) {
                    console.error("Popup login failed", err);
                    alert("Login popup was blocked or failed. Please try again or allow popups.");
                    return;
                }
            }

            setIsSubmitting(true);
            try {
                let imageUrl: string | undefined = undefined;
                if (logoFile) {
                    imageUrl = await compressImage(logoFile).catch((err) => {
                        console.warn('Image compression failed, using fallback reader:', err);
                        return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = (err) => reject(err);
                            reader.readAsDataURL(logoFile);
                        });
                    }).catch(() => undefined);
                }

                const token = await getAccessTokenSilently();
                await registerSalon(token, { ...formData, image: imageUrl });
                window.location.href = '/dashboard'; 
            } catch(e) {
                console.error('Registration failed', e);
                alert('Failed to register salon. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <main className="velvet-signup-page">
            <div className="velvet-container">
                {/* Multi-Step Progress Indicator */}
                <div className="velvet-progress-wrapper">
                    <div className="velvet-progress-track">
                        <div className="velvet-progress-line" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}></div>
                    </div>
                    
                    <div className="velvet-step-items">
                        <div className="velvet-step-item">
                            <div className={`velvet-step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
                            <span className={`velvet-step-label ${step >= 1 ? 'active' : ''}`}>Brand</span>
                        </div>
                        <div className="velvet-step-item">
                            <div className={`velvet-step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
                            <span className={`velvet-step-label ${step >= 2 ? 'active' : ''}`}>Location</span>
                        </div>
                        <div className="velvet-step-item">
                            <div className={`velvet-step-circle ${step >= 3 ? 'active' : ''}`}>3</div>
                            <span className={`velvet-step-label ${step >= 3 ? 'active' : ''}`}>Services</span>
                        </div>
                    </div>
                </div>

                <div className="velvet-grid">
                    {/* Main Form Card */}
                    <div className="velvet-form-card">
                        <div className="velvet-form-header">
                            <h1>{step === 1 ? 'Build Your Identity' : step === 2 ? 'Set Your Location' : 'Ready to Launch'}</h1>
                            <p>
                                {step === 1 && 'Introduce your salon to the world. This information will be visible to your future clients.'}
                                {step === 2 && 'Where can clients find you? Enter your physical address and contact details.'}
                                {step === 3 && 'Review your details and finalize your registration to access your dashboard.'}
                            </p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="velvet-form">
                            {step === 1 && (
                                <div className="velvet-step-content fade-in">
                                    <div className="velvet-form-row">
                                        <div className="velvet-input-group">
                                            <label>Salon Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Velvet Rose Studio" 
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="velvet-input-group">
                                            <label>Tagline</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Luxury hair and skin care" 
                                                value={formData.tagline}
                                                onChange={e => setFormData({...formData, tagline: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="velvet-input-group">
                                        <label>The Salon Story</label>
                                        <textarea 
                                            placeholder="Share the heritage and mission of your salon..." 
                                            rows={4}
                                            value={formData.story}
                                            onChange={e => setFormData({...formData, story: e.target.value})}
                                        ></textarea>
                                    </div>
                                    
                                    <div className="velvet-input-group">
                                        <label>Brand Logo</label>
                                        <div className="velvet-file-upload">
                                            <Upload className="upload-icon" size={32} style={{ color: 'var(--velvet-primary)', marginBottom: '0.5rem' }} />
                                            <p className="upload-title">{logoFile ? 'Change logo' : 'Click to upload logo'}</p>
                                            <p className="upload-subtitle">{logoFile ? logoFile.name : 'SVG, PNG, or JPG (Max. 2MB)'}</p>
                                            <input 
                                                type="file" 
                                                className="file-input" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setLogoFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="velvet-step-content fade-in">
                                    <div className="velvet-input-group">
                                        <label>Street Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g., 123 Main Street" 
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="velvet-form-row">
                                        <div className="velvet-input-group">
                                            <label>City</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Accra" 
                                                value={formData.city}
                                                onChange={e => setFormData({...formData, city: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="velvet-input-group">
                                            <label>Region</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Greater Accra" 
                                                value={formData.state}
                                                onChange={e => setFormData({...formData, state: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="velvet-input-group">
                                        <label>Phone Number</label>
                                        <input 
                                            type="tel" 
                                            placeholder="e.g., +1 234 567 8900" 
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="velvet-step-content fade-in">
                                    <div className="velvet-summary-card">
                                        <div className="summary-header">
                                            <div className="summary-icon-preview">
                                                {logoFile ? (
                                                    <img src={URL.createObjectURL(logoFile)} alt="Salon Logo" />
                                                ) : (
                                                    <Store size={32} />
                                                )}
                                            </div>
                                            <div className="summary-title-block">
                                                <span className="summary-badge">Ready to Launch</span>
                                                <h2 className="summary-title">{formData.name || 'Your Salon'}</h2>
                                                {formData.tagline && <p className="summary-tagline">"{formData.tagline}"</p>}
                                            </div>
                                        </div>

                                        <div className="summary-details-grid">
                                            <div className="summary-detail-item">
                                                <div className="summary-item-icon">
                                                    <MapPin size={18} />
                                                </div>
                                                <div className="summary-item-content">
                                                    <span className="summary-item-label">Location</span>
                                                    <span className="summary-item-value">{formData.address}, {formData.city}, {formData.state}</span>
                                                </div>
                                            </div>

                                            <div className="summary-detail-item">
                                                <div className="summary-item-icon">
                                                    <Phone size={18} />
                                                </div>
                                                <div className="summary-item-content">
                                                    <span className="summary-item-label">Contact Phone</span>
                                                    <span className="summary-item-value">{formData.phone || 'Not provided'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!isAuthenticated && (
                                        <div className="velvet-auth-warning">
                                            <Lock size={20} style={{ flexShrink: 0 }} />
                                            <p>Almost there! We'll just need you to log in or create an account to securely save your salon profile.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="velvet-form-actions">
                                <button 
                                    type="button" 
                                    className="velvet-btn-text" 
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </button>
                                
                                <div className="velvet-actions-right">
                                    {step > 1 && (
                                        <button type="button" className="velvet-btn-secondary" onClick={() => setStep(step - 1)}>
                                            Back
                                        </button>
                                    )}
                                    {step < 3 ? (
                                        <button type="submit" className="velvet-btn-primary">
                                            Continue
                                        </button>
                                    ) : (
                                        <button 
                                            type="submit" 
                                            className="velvet-btn-primary shadow-glow" 
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Registering...' : (!isAuthenticated ? 'Log in & Complete' : 'Complete Registration')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar: Benefits & Visuals */}
                    <aside className="velvet-sidebar">
                        <div className="velvet-visual-card group">
                            <img 
                                src="/images/register-salon-inspiration.jpg" 
                                alt="Salon Inspiration" 
                            />
                            <div className="velvet-visual-overlay"></div>
                            <div className="velvet-visual-text">
                                <p className="subtitle">INSPIRATION</p>
                                <p className="title">Crafting the future of beauty management.</p>
                            </div>
                        </div>

                        <div className="velvet-benefits-card">
                            <h3>Why register with us</h3>
                            <ul>
                                <li>
                                    <div className="icon-wrapper">
                                        <Users size={18} />
                                    </div>
                                    <div className="content">
                                        <h4>Reach More Clients</h4>
                                        <p>Gain visibility in our exclusive marketplace of wellness enthusiasts.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon-wrapper">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="content">
                                        <h4>Seamless Booking</h4>
                                        <p>Automated scheduling and reminders to reduce no-shows by 40%.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon-wrapper">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="content">
                                        <h4>Revenue Growth</h4>
                                        <p>Smart analytics and upsell tools designed for beauty experts.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
