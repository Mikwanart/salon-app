import { useState } from 'react';
import { User, Scissors, ShieldCheck } from 'lucide-react';
import './RolePickerModal.css';

export type LoginMode = 'login' | 'signup';

interface RolePickerModalProps {
    isOpen: boolean;
    mode?: LoginMode;
    onClose: () => void;
    onConfirm: (role: string, mode: LoginMode) => void;
}

const ROLES = [
    {
        id: 'client',
        Icon: User,
        label: 'Client',
    },
    {
        id: 'salon_owner',
        Icon: Scissors,
        label: 'Salon Owner',
    },
    {
        id: 'admin',
        Icon: ShieldCheck,
        label: 'Administrator',
    },
];

export default function RolePickerModal({ isOpen, mode = 'login', onClose, onConfirm }: RolePickerModalProps) {
    const [selected, setSelected] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="role-picker-overlay" onClick={handleOverlayClick}>
            <div className="role-picker-card" role="dialog" aria-modal="true" aria-label="Sign in as a">
                <button className="rp-close" onClick={onClose} aria-label="Close">✕</button>

                <div className="rp-header">
                    <h2>{mode === 'signup' ? 'Sign up as a' : 'Sign in as a'}</h2>
                </div>

                <div className="rp-roles">
                    {ROLES.map(({ id, Icon, label }) => (
                        <button
                            key={id}
                            type="button"
                            data-role={id}
                            className={`rp-role-btn${selected === id ? ' selected' : ''}`}
                            onClick={() => setSelected(id)}
                        >
                            <div className="rp-role-icon">
                                <Icon size={22} className="velvet-icon" />
                            </div>
                            <div className="rp-role-text">
                                <strong>{label}</strong>
                            </div>
                            <div className="rp-check">
                                {selected === id && (
                                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                        <path d="M1 4L4 7.5L10 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="rp-actions">
                    <button
                        className="rp-continue-btn"
                        disabled={!selected}
                        onClick={() => selected && onConfirm(selected, mode)}
                    >
                        {mode === 'signup' ? 'Sign Up' : 'Sign In'} as {selected ? ROLES.find(r => r.id === selected)?.label : '…'}
                    </button>
                </div>
            </div>
        </div>
    );
}
