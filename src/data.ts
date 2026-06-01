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
  image: string;
  rating: number;
  specialties: string[];
}

import { calculateDistance } from './lib/geo';

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
    name: 'Precision Haircuts',
    category: 'Haircare',
    price: 65,
    duration: '45 min',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800',
    description: 'Expert precision cuts tailored to your face shape and personal style.',
  },
  {
    id: 's2',
    name: 'Artistic Manicures',
    category: 'Nail Art',
    price: 45,
    duration: '60 min',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
    description: 'Creative nail art and luxurious hand treatments for a stunning finish.',
  },
  {
    id: 's3',
    name: 'Revitalizing Facials',
    category: 'Skincare',
    price: 90,
    duration: '75 min',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
    description: 'Deep cleansing and rejuvenating facial treatments for radiant skin.',
  },
  {
    id: 's4',
    name: 'Glamour Makeup',
    category: 'Makeup',
    price: 85,
    duration: '60 min',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
    description: 'Professional makeup artistry for weddings, events, and everyday glam.',
  },
  {
    id: 's5',
    name: 'Balayage Coloring',
    category: 'Haircare',
    price: 150,
    duration: '120 min',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800',
    description: 'Seamless, sun-kissed balayage coloring for a natural dimensional look.',
  },
  {
    id: 's6',
    name: 'Gel Extensions',
    category: 'Nail Art',
    price: 70,
    duration: '90 min',
    image: 'https://images.unsplash.com/photo-1632345033839-245a999b5317?auto=format&fit=crop&q=80&w=800',
    description: 'Long-lasting gel nail extensions with flawless application.',
  },
  {
    id: 's7',
    name: 'Chemical Peel',
    category: 'Skincare',
    price: 120,
    duration: '45 min',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=800',
    description: 'Clinical-grade chemical peels to smooth texture and brighten skin tone.',
  },
  {
    id: 's8',
    name: 'Bridal Makeup',
    category: 'Makeup',
    price: 200,
    duration: '90 min',
    image: 'https://images.unsplash.com/photo-1522337363623-ac173617342b?auto=format&fit=crop&q=80&w=800',
    description: 'Complete bridal beauty package with trial session included.',
  },
];

export const stylists: Stylist[] = [
  {
    id: 'st1',
    name: 'Emma Laurent',
    role: 'Senior Stylist',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    specialties: ['Balayage', 'Precision Cuts', 'Bridal'],
  },
  {
    id: 'st2',
    name: 'Sofia Chen',
    role: 'Nail Artist',
    image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    specialties: ['Gel Art', 'French Tips', '3D Nail Art'],
  },
  {
    id: 'st3',
    name: 'Olivia Martinez',
    role: 'Skincare Specialist',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    specialties: ['Chemical Peels', 'Hydrafacials', 'Anti-Aging'],
  },
  {
    id: 'st4',
    name: 'Chloe Williams',
    role: 'Makeup Artist',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    rating: 4.7,
    specialties: ['Bridal', 'Editorial', 'Special FX'],
  },
];

export const salons: Salon[] = [
  {
    id: 'salon1',
    name: 'Lumiere Beauty Studio',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    reviewCount: 2451,
    location: 'Beverly Hills',
    address: '9630 Santa Monica Blvd, Beverly Hills, CA 90210',
    distance: '0.8 miles away',
    hours: 'Mon-Sat: 9AM - 8PM | Sun: 10AM - 6PM',
    phone: '(310) 555-0142',
    description: 'Award-winning luxury beauty studio offering premium hair, nail, and skincare services in the heart of Beverly Hills. Our team of expert stylists brings over 50 years of combined experience.',
    coordinates: { lat: 34.0736, lng: -118.4004 },
    services: services.slice(0, 4),
    stylists: stylists.slice(0, 2),
    reviews: [
      { id: 'r1', author: 'Jessica T.', rating: 5, date: '2 days ago', text: 'Absolutely incredible experience! Emma did my balayage and it turned out beyond my expectations. The salon ambiance is so relaxing.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' },
      { id: 'r2', author: 'Maria K.', rating: 5, date: '1 week ago', text: 'Best salon in Beverly Hills hands down. Been coming here for 3 years and never disappointed.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
      { id: 'r3', author: 'Amanda L.', rating: 4, date: '2 weeks ago', text: 'Great services, the facial was very relaxing. Slightly long wait time but worth it.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'salon2',
    name: 'The Velvet Chair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    reviewCount: 1284,
    location: 'Downtown',
    address: '350 S Grand Ave, Los Angeles, CA 90071',
    distance: '1.2 miles away',
    hours: 'Mon-Fri: 8AM - 9PM | Sat-Sun: 9AM - 7PM',
    phone: '(213) 555-0198',
    description: 'A modern, chic salon specializing in cutting-edge hair techniques and artisan nail services. Our downtown location is your urban oasis for beauty and self-care.',
    coordinates: { lat: 34.0522, lng: -118.2528 },
    services: services.slice(2, 6),
    stylists: stylists.slice(1, 3),
    reviews: [
      { id: 'r4', author: 'Rachel G.', rating: 5, date: '3 days ago', text: 'Love the vibe here! The gel extension work is some of the best I\'ve ever had. Super creative designs.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
      { id: 'r5', author: 'Dana W.', rating: 4, date: '1 week ago', text: 'Clean, modern space with talented stylists. The chemical peel really made a difference for my skin.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'salon3',
    name: 'Pure Aura Spa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    reviewCount: 876,
    location: 'West End',
    address: '1201 Abbot Kinney Blvd, Venice, CA 90291',
    distance: '2.5 miles away',
    hours: 'Daily: 9AM - 9PM',
    phone: '(424) 555-0167',
    description: 'An exclusive spa and beauty destination focused on holistic beauty treatments. We combine traditional techniques with modern innovation for transformative results.',
    coordinates: { lat: 33.9975, lng: -118.4734 },
    services: services.slice(4, 8),
    stylists: stylists.slice(2, 4),
    reviews: [
      { id: 'r6', author: 'Sophia R.', rating: 5, date: '1 day ago', text: 'Pure bliss! The bridal makeup trial was perfect. Olivia really listened to what I wanted.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' },
      { id: 'r7', author: 'Emily H.', rating: 5, date: '5 days ago', text: 'The most relaxing spa experience I\'ve ever had. Every detail is thought through.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
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
  { time: '12:00 PM', available: true },
  { time: '12:30 PM', available: true },
  { time: '1:00 PM', available: false },
  { time: '1:30 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '2:30 PM', available: true },
  { time: '3:00 PM', available: false },
  { time: '3:30 PM', available: true },
  { time: '4:00 PM', available: true },
  { time: '4:30 PM', available: true },
  { time: '5:00 PM', available: true },
  { time: '5:30 PM', available: false },
  { time: '6:00 PM', available: true },
  { time: '6:30 PM', available: true },
];

export const mapApiSalonToFrontendSalon = (apiSalon: any, userCoords?: { lat: number; lng: number } | null): Salon => {
  let rating = 4.8;
  if (apiSalon.reviews && apiSalon.reviews.length > 0) {
    const totalRating = apiSalon.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    rating = Number((totalRating / apiSalon.reviews.length).toFixed(1));
  }

  const mappedReviews = (apiSalon.reviews || []).map((r: any) => ({
    id: r.id,
    author: r.user?.name || 'Anonymous User',
    rating: r.rating,
    date: new Date(r.createdAt).toLocaleDateString(),
    text: r.comment || '',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  }));

  const mappedServices = (apiSalon.services || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    category: s.category || 'General',
    price: s.price,
    duration: `${s.duration} min`,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800',
    description: s.description || '',
  }));

  const mappedStylists = apiSalon.stylists && apiSalon.stylists.length > 0
    ? apiSalon.stylists.map((st: any) => ({
        id: st.id,
        name: st.name,
        role: st.role,
        image: st.image || 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=400',
        rating: st.rating,
        specialties: st.specialties || [],
      }))
    : stylists;

  let coords = { lat: 34.0522, lng: -118.2528 };
  if (apiSalon.name.includes('Lumiere')) {
    coords = { lat: 34.0689, lng: -118.4057 };
  } else if (apiSalon.name.includes('Velvet')) {
    coords = { lat: 34.0519, lng: -118.2512 };
  } else if (apiSalon.name.includes('Pure Aura')) {
    coords = { lat: 33.9904, lng: -118.4651 };
  }

  let distance = '1.5 miles away';
  if (userCoords) {
    const miles = calculateDistance(userCoords, coords);
    distance = `${miles} miles away`;
  } else {
    // default distance from general LA center
    const defaultUserCoords = { lat: 34.0522, lng: -118.2437 };
    const miles = calculateDistance(defaultUserCoords, coords);
    distance = `${miles} miles away`;
  }

  return {
    id: apiSalon.id,
    name: apiSalon.name,
    image: apiSalon.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800',
    rating: rating,
    reviewCount: apiSalon.reviews?.length || 0,
    location: apiSalon.city,
    address: apiSalon.address,
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
