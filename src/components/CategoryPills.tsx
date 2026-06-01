import { categories } from '../data';
import { Sparkles, Scissors, Hand, Droplet, Palette } from 'lucide-react';
import './CategoryPills.css';

interface Props {
    active: string;
    onChange: (category: string) => void;
}

const icons: Record<string, React.ReactNode> = {
    'All Services': <Sparkles size={18} />,
    Haircare: <Scissors size={18} />,
    'Nail Art': <Hand size={18} />,
    Skincare: <Droplet size={18} />,
    Makeup: <Palette size={18} />,
};

export default function CategoryPills({ active, onChange }: Props) {
    return (
        <div className="category-pills">
            {categories.map((cat) => (
                <button
                    key={cat}
                    className={`pill ${active === cat ? 'active' : ''}`}
                    onClick={() => onChange(cat)}
                >
                    <span className="pill-icon">{icons[cat] || '•'}</span>
                    {cat}
                </button>
            ))}
        </div>
    );
}
