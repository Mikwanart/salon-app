export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  image: string;
  description: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: string;
  rating: number;
  specialties: string[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  avatar: string;
}

export interface Salon {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  distance: string;
  services: Service[];
  stylists: Stylist[];
  reviews: Review[];
  hours: string;
  phone: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const categories = [
  'All Services',
  'Haircare',
  'Nail Art',
  'Skincare',
  'Makeup',
];

export const services: Service[] = [
  {
    id: 's1',
    name: 'Braiding & Locs',
    category: 'Haircare',
    price: 250,
    duration: '180 min',
    image: '/images/knotless-box-braids.jpg',
    description: 'Neat, lightweight knotless braids and loc installations crafted with scalp protection and seamless parting.',
  },
  {
    id: 's2',
    name: 'Ankara Art Manicure',
    category: 'Nail Art',
    price: 90,
    duration: '60 min',
    image: '/images/ankara-manicure.jpg',
    description: 'Vivid African print nail designs featuring hand-painted geometric wax motifs and hand spa treatment.',
  },
  {
    id: 's3',
    name: 'Wigs & Styling',
    category: 'Haircare',
    price: 150,
    duration: '90 min',
    image: '/images/wig4.jpg',
    description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.',
  },
  {
    id: 's4',
    name: 'Natural Hair Care',
    category: 'Haircare',
    price: 200,
    duration: '75 min',
    image: '/images/nc.jpg',
    description: 'Deep hydration treatments, scalp steam conditioning, natural coil definition, and moisture lock care.',
  },
  {
    id: 's5',
    name: 'Fulani Braids with Beads',
    category: 'Haircare',
    price: 220,
    duration: '150 min',
    image: '/images/fulani-braids.jpg',
    description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.',
  },
  {
    id: 's6',
    name: 'Goddess Locs',
    category: 'Haircare',
    price: 280,
    duration: '210 min',
    image: '/images/goddess-locs.jpg',
    description: 'Boho chic faux locs with curly wavy ends for an effortless regal, lightweight crown.',
  },
  {
    id: 's7',
    name: 'Afro Fade & Sharp Line-up',
    category: 'Haircare',
    price: 120,
    duration: '45 min',
    image: '/images/taper-fade.jpg',
    description: 'Crisp taper fade, texturized afro top conditioning, hot towel, and razor-sharp line-up.',
  },
  {
    id: 's8',
    name: 'Ghana Weaving & Cornrows',
    category: 'Haircare',
    price: 180,
    duration: '120 min',
    image: '/images/ghana-weaving.jpg',
    description: 'Intricate feed-in cornrow patterns rooted in rich West African artistry and scalp care.',
  },
];

// ─── Per-salon unique service sets ───────────────────────────────────────────

const salon1Services: Service[] = [
  {
    id: 'sl1-s1',
    name: 'Braiding & Locs',
    category: 'Haircare',
    price: 250,
    duration: '180 min',
    image: '/images/knotless-box-braids.jpg',
    description: 'Neat, lightweight knotless braids and loc installations crafted with scalp protection and seamless parting.',
  },
  {
    id: 'sl1-s2',
    name: 'Fulani Braids with Beads',
    category: 'Haircare',
    price: 220,
    duration: '150 min',
    image: '/images/fulani-braids.jpg',
    description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.',
  },
  {
    id: 'sl1-s3',
    name: 'Ghana Weaving & Cornrows',
    category: 'Haircare',
    price: 180,
    duration: '120 min',
    image: '/images/ghana-weaving.jpg',
    description: 'Intricate feed-in cornrow patterns rooted in rich West African artistry and scalp care.',
  },
];

const salon2Services: Service[] = [
  {
    id: 'sl2-s1',
    name: 'Ankara Art Manicure',
    category: 'Nail Art',
    price: 90,
    duration: '60 min',
    image: '/images/ankara-manicure.jpg',
    description: 'Vivid African print nail designs featuring hand-painted geometric wax motifs and hand spa treatment.',
  },
  {
    id: 'sl2-s2',
    name: 'Wigs & Styling',
    category: 'Haircare',
    price: 150,
    duration: '90 min',
    image: '/images/wig4.jpg',
    description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.',
  },
  {
    id: 'sl2-s3',
    name: 'Silk Press & Blowout',
    category: 'Haircare',
    price: 160,
    duration: '75 min',
    image: '',
    description: 'Smooth, glossy silk press treatment paired with a professional blowout for sleek, frizz-free results.',
  },
];

const salon3Services: Service[] = [
  {
    id: 'sl3-s1',
    name: 'Goddess Locs',
    category: 'Haircare',
    price: 280,
    duration: '210 min',
    image: '/images/goddess-locs.jpg',
    description: 'Boho chic faux locs with curly wavy ends for an effortless regal, lightweight crown.',
  },
  {
    id: 'sl3-s2',
    name: 'Shea Butter Facial',
    category: 'Skincare',
    price: 130,
    duration: '60 min',
    image: '',
    description: 'Deep hydrating facial for melanin-rich skin infused with raw African shea butter and black soap exfoliation.',
  },
  {
    id: 'sl3-s3',
    name: 'Gele & Bridal Glam',
    category: 'Makeup',
    price: 250,
    duration: '90 min',
    image: '',
    description: 'Full bridal glam beat crafted for deep skin tones paired with traditional Gele headwrap luxury styling.',
  },
];

const salon4Services: Service[] = [
  {
    id: 'sl4-s1',
    name: 'Natural Hair Care',
    category: 'Haircare',
    price: 200,
    duration: '75 min',
    image: '/images/nc.jpg',
    description: 'Deep hydration treatments, scalp steam conditioning, natural coil definition, and moisture lock care.',
  },
  {
    id: 'sl4-s2',
    name: 'Afro Fade & Sharp Line-up',
    category: 'Haircare',
    price: 120,
    duration: '45 min',
    image: '/images/taper-fade.jpg',
    description: 'Crisp taper fade, texturized afro top conditioning, hot towel, and razor-sharp line-up.',
  },
  {
    id: 'sl4-s3',
    name: 'Beard Grooming & Hot Towel',
    category: 'Haircare',
    price: 80,
    duration: '30 min',
    image: '',
    description: 'Precision beard shaping, edge-up, hot towel steam treatment, and moisturising balm finish.',
  },
];



export const stylists: Stylist[] = [
  {
    id: 'st1',
    name: 'Akosua Pokuaa',
    role: 'Master Braider & Loc Specialist',
    bio: 'Specializes in protective styling, knotless braids, and loc maintenance with 8+ years of expertise.',
    image: '/stylists/2CzySFQXCn7b9cwTICoc_.jpg',
    rating: 4.9,
    specialties: ['Knotless Braids', 'Fulani Braids', 'Goddess Locs'],
  },
  {
    id: 'st2',
    name: 'Ama Serwaa',
    role: 'Nail & Ankara Artist',
    bio: 'Nail artist & beauty therapist known for custom Ankara pattern press-ons and spa pedicures.',
    image: '/stylists/LlcsU7WHjgJpAlru3401_.jpg',
    rating: 4.8,
    specialties: ['Ankara Art', 'Gel Extensions', 'Spa Pedicures'],
  },
  {
    id: 'st3',
    name: 'Abena Osei',
    role: 'Melanin Skincare Specialist',
    bio: 'Certified esthetician dedicated to melanin skincare, shea butter facials, and deep glow treatments.',
    image: '/stylists/OgRb8FZ4e4Gk_P9-oI6NK.jpg',
    rating: 4.9,
    specialties: ['Shea Butter Facials', 'Melanin Glow', 'Chemical Peels'],
  },
  {
    id: 'st4',
    name: 'Yaa Asantewaa',
    role: 'Afro Glam & Gele Styling Artist',
    bio: 'Afro glam makeup artist and Gele wrapping specialist for weddings and high-fashion events.',
    image: '/stylists/Photo by Horci via Iwaria.jpg',
    rating: 4.8,
    specialties: ['Gele Styling', 'Bridal Glam', 'Editorial Beats'],
  },
  {
    id: 'st5',
    name: 'Kofi Boakye',
    role: 'Barbering & Afro Precision Cut Specialist',
    bio: 'Master barber specializing in precision Afro fades, razor-sharp lineups, and beard styling.',
    image: '/stylists/Photo by Kelvin Smile via Iwaria.jpg',
    rating: 4.9,
    specialties: ['Afro Fade', 'Sharp Line-up', 'Beard Grooming'],
  },
  {
    id: 'st6',
    name: 'Adwoa Kyei',
    role: 'Wig Customization & Silk Press Specialist',
    bio: 'Wig customizer & silk press master focused on heat protection and natural hair health.',
    image: '', // Test avatar fallback
    rating: 4.9,
    specialties: ['Wig Melt', 'Silk Press', 'Frontal Customization'],
  },
];

export const salons: Salon[] = [
  {
    id: 'salon1',
    name: 'Maame Akua Braiding Salon',
    image: '/images/maame-akua-salon.jpg',
    rating: 4.9,
    reviewCount: 2451,
    location: 'Cantonments, Accra',
    address: '14 Independence Ave, Cantonments, Accra, Ghana',
    distance: '0.8 miles away',
    hours: 'Mon-Sat: 8AM - 8PM | Sun: 10AM - 6PM',
    phone: '+233 24 555 0142',
    description: 'Award-winning luxury African hair braiding lounge offering premium knotless braids, Fulani styles, locs, and scalp protection care in Cantonments, Accra.',
    coordinates: { lat: 5.5801, lng: -0.1746 },
    services: salon1Services,
    stylists: stylists.slice(0, 2),
    reviews: [
      { id: 'r1', author: 'Akosua M.', rating: 5, date: '2 days ago', text: 'Akosua did my knotless braids at Maame Akua Salon and they are so neat and completely painless!', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400' },
      { id: 'r2', author: 'Esi K.', rating: 5, date: '1 week ago', text: 'Best salon in Accra hands down! The Ghana weaving was top-notch and completed right on schedule.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
      { id: 'r3', author: 'Afia K.', rating: 4, date: '2 weeks ago', text: 'Great customer service and relaxing facial treatment. Will definitely come back.', avatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'salon2',
    name: 'Osu Ebony & Gold Hair Studio',
    image: '/images/salon-2.jpg',
    rating: 4.8,
    reviewCount: 1284,
    location: 'Osu, Accra',
    address: '42 Ring Road East, Osu, Accra, Ghana',
    distance: '1.2 miles away',
    hours: 'Mon-Fri: 8AM - 9PM | Sat-Sun: 9AM - 7PM',
    phone: '+233 20 555 0198',
    description: 'A modern, chic African beauty sanctuary specializing in natural hair care, Ankara nail art, and precision styling in Osu.',
    coordinates: { lat: 5.5560, lng: -0.1821 },
    services: salon2Services,
    stylists: stylists.slice(1, 3),
    reviews: [
      { id: 'r4', author: 'Kofi B.', rating: 5, date: '3 days ago', text: 'Loved the afro fade and line-up. Sharp precision and friendly barber staff!', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
      { id: 'r5', author: 'Yaa A.', rating: 4, date: '1 week ago', text: 'Super creative Ankara nail designs by Ama Serwaa. Clean space with awesome music.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'salon3',
    name: 'Akoma Spa & Beauty Sanctuary',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    reviewCount: 876,
    location: 'East Legon, Accra',
    address: '88 Lagos Avenue, East Legon, Accra, Ghana',
    distance: '2.5 miles away',
    hours: 'Daily: 9AM - 9PM',
    phone: '+233 26 555 0167',
    description: 'An exclusive spa and beauty destination focused on holistic African hair care, Gele wrapping, and luxury pampering.',
    coordinates: { lat: 5.6358, lng: -0.1601 },
    services: salon3Services,
    stylists: stylists.slice(2, 4),
    reviews: [
      { id: 'r6', author: 'Adwoa B.', rating: 5, date: '1 day ago', text: 'Pure royal experience! My Gele styling and makeup beat lasted all through my wedding reception.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400' },
      { id: 'r7', author: 'Abena P.', rating: 5, date: '5 days ago', text: 'The Goddess Locs installation was stunning and lightweight. 10/10 recommendation!', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'salon4',
    name: 'Obaahema Royalty Silk and Afro Salon',
    image: '/images/salon-1.jpg',
    rating: 4.9,
    reviewCount: 650,
    location: 'Kejetia, Kumasi',
    address: '15 Kejetia Market Rd, Kumasi, Ghana',
    distance: '1.8 miles away',
    hours: 'Mon-Sat: 8:30AM - 8PM',
    phone: '+233 27 555 0189',
    description: 'Boutique hair bar offering silk press treatments, loc maintenance, natural hair steam conditioning, and custom wig styling in Kejetia.',
    coordinates: { lat: 6.6961, lng: -1.6244 },
    services: salon4Services,
    stylists: stylists.slice(0, 3),
    reviews: [
      { id: 'r8', author: 'Nana Yaa K.', rating: 5, date: '4 days ago', text: 'Best silk press in Kumasi! My hair feels so soft and full of volume.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400' },
    ],
  },
];

export const timeSlots: TimeSlot[] = [
  { time: '9:00 AM', available: true },
  { time: '9:30 AM', available: true },
  { time: '10:00 AM', available: false },
  { time: '10:30 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '11:30 AM', available: false },
  { time: '1:00 PM', available: true },
  { time: '1:30 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '2:30 PM', available: false },
  { time: '3:00 PM', available: true },
  { time: '3:30 PM', available: true },
  { time: '4:00 PM', available: true },
  { time: '4:30 PM', available: true },
];

export function calculateDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLng = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * (Math.PI / 180)) *
      Math.cos(coords2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export const mapApiSalonToFrontendSalon = (apiSalon: any, userCoords?: { lat: number; lng: number } | null): Salon => {
  const rating = apiSalon.reviews && apiSalon.reviews.length > 0
    ? Math.round((apiSalon.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / apiSalon.reviews.length) * 10) / 10
    : 4.8;

  const mappedReviews = (apiSalon.reviews || []).map((r: any) => ({
    id: r.id,
    author: r.user?.name || 'Satisfied Client',
    rating: r.rating,
    date: new Date(r.createdAt || Date.now()).toLocaleDateString(),
    text: r.comment || '',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400',
  }));

  const mappedServices = (apiSalon.services && apiSalon.services.length > 0) ? apiSalon.services.map((s: any) => ({
    id: s.id,
    name: s.name,
    category: s.category || 'Haircare',
    price: s.price,
    duration: s.duration,
    description: s.description || '',
    image: s.image || '',
  })) : services;

  const mappedStylists = (apiSalon.stylists && apiSalon.stylists.length > 0) ? apiSalon.stylists.map((st: any) => ({
    id: st.id,
    name: st.name,
    role: st.role,
    bio: st.bio || '',
    image: st.image || '',
    rating: st.rating || 5.0,
    specialties: st.specialties || [],
  })) : stylists;

  const coords = apiSalon.coordinates || { lat: 5.5560, lng: -0.1821 };

  let distance = '1.5 miles away';
  if (userCoords) {
    const miles = calculateDistance(userCoords, coords);
    distance = `${miles} miles away`;
  } else {
    const defaultUserCoords = { lat: 5.5560, lng: -0.1821 };
    const miles = calculateDistance(defaultUserCoords, coords);
    distance = `${miles} miles away`;
  }

  const salonImage = apiSalon.image || '/images/salon-4.jpg';

  const location = apiSalon.location || apiSalon.city || 'Accra, Ghana';

  return {
    id: apiSalon.id,
    name: apiSalon.name,
    image: salonImage,
    rating: rating,
    reviewCount: apiSalon.reviews?.length || 0,
    location: location,
    address: apiSalon.address || 'Accra, Ghana',
    distance: distance,
    hours: 'Mon-Sat: 9AM - 8PM | Sun: 10AM - 6PM',
    phone: apiSalon.phone || '',
    description: apiSalon.description || '',
    coordinates: coords,
    services: mappedServices,
    stylists: mappedStylists,
    reviews: mappedReviews,
  };
};
