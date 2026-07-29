import { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database with dummy data...');

  // 1. Create a dummy Salon Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@lumiere.com' },
    update: {},
    create: {
      auth0Id: 'auth0|owner-1',
      email: 'owner@lumiere.com',
      name: 'Emma Salon Owner',
      role: Role.SALON_OWNER,
    },
  });

  // 2. Create some dummy Client users for reviews
  const client1 = await prisma.user.upsert({
    where: { email: 'jessica@example.com' },
    update: {},
    create: {
      auth0Id: 'auth0|client-1',
      email: 'jessica@example.com',
      name: 'Jessica T.',
      role: Role.CLIENT,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      auth0Id: 'auth0|client-2',
      email: 'maria@example.com',
      name: 'Maria K.',
      role: Role.CLIENT,
    },
  });

  // 3. Define Salons (matching frontend data.ts)
  const salonsData = [
    {
      name: 'Maame Akua Braiding Salon',
      image: '/images/salon-3.jpg',
      address: '14 Independence Ave',
      city: 'Cantonments, Accra',
      state: 'Greater Accra',
      zip: '00233',
      phone: '+233 24 555 0142',
      description: 'Award-winning luxury African hair braiding lounge offering premium knotless braids, Fulani styles, locs, and scalp protection care in Cantonments, Accra.',
      services: [
        { name: 'Ghana Feed-In Braids & Knotless Locs', category: 'Haircare', price: 250, duration: 180, description: 'Neat, lightweight knotless braids and loc installations crafted with scalp protection and seamless parting.' },
        { name: 'Kente Art Manicure & Hand Spa', category: 'Nail Art', price: 90, duration: 60, description: 'Vivid Ghanaian Kente print nail designs featuring hand-painted geometric wax motifs and natural shea hand spa treatment.' },
        { name: 'Frontal Melt & Ghanaian Custom Unit', category: 'Wigs & Styling', price: 150, duration: 90, description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.' },
        { name: 'Shea Butter Moisture Lock & Scalp Steam', category: 'Natural Hair Care', price: 200, duration: 75, description: 'Deep hydration treatments, Tamale shea butter scalp steam conditioning, natural coil definition, and moisture lock care.' }
      ]
    },
    {
      name: 'Osu Ebony & Gold Hair Studio',
      image: '/images/salon-2.jpg',
      address: '42 Ring Road East',
      city: 'Osu, Accra',
      state: 'Greater Accra',
      zip: '00233',
      phone: '+233 20 555 0198',
      description: 'A modern, chic African beauty sanctuary specializing in natural hair care, Ankara nail art, and precision styling in Osu.',
      services: [
        { name: 'Frontal Melt & Ghanaian Custom Unit', category: 'Wigs & Styling', price: 150, duration: 90, description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.' },
        { name: 'Shea Butter Moisture Lock & Scalp Steam', category: 'Natural Hair Care', price: 200, duration: 75, description: 'Deep hydration treatments, Tamale shea butter scalp steam conditioning, natural coil definition, and moisture lock care.' },
        { name: 'Fulani Tribal Braids with Brass & Beads', category: 'Haircare', price: 220, duration: 150, description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.' },
        { name: 'Boho Goddess Locs & Ashanti Crown', category: 'Haircare', price: 280, duration: 210, description: 'Boho chic faux locs with curly wavy ends for an effortless regal crown.' }
      ]
    },
    {
      name: 'Akoma Spa & Beauty Sanctuary',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
      address: '88 Lagos Avenue',
      city: 'East Legon, Accra',
      state: 'Greater Accra',
      zip: '00233',
      phone: '+233 26 555 0167',
      description: 'An exclusive spa and beauty destination focused on holistic African hair care, Gele wrapping, and luxury pampering.',
      services: [
        { name: 'Fulani Tribal Braids with Brass & Beads', category: 'Haircare', price: 220, duration: 150, description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.' },
        { name: 'Boho Goddess Locs & Ashanti Crown', category: 'Haircare', price: 280, duration: 210, description: 'Boho chic faux locs with curly wavy ends for an effortless regal crown.' },
        { name: 'Accra Sharp Taper Fade & Line-Up', category: 'Barbering', price: 120, duration: 45, description: 'Crisp taper fade, texturized afro top conditioning, hot towel, and razor-sharp line-up.' },
        { name: 'Ghana Weaving & Feed-in Cornrows', category: 'Haircare', price: 180, duration: 120, description: 'Intricate feed-in cornrow patterns rooted in rich West African artistry and scalp care.' }
      ]
    }
  ];

  // Insert Salons and their Services
  for (const s of salonsData) {
    const existingSalon = await prisma.salon.findFirst({ where: { name: s.name } });
    
    if (!existingSalon) {
      const salon = await prisma.salon.create({
        data: {
          name: s.name,
          image: s.image,
          address: s.address,
          city: s.city,
          state: s.state,
          zip: s.zip,
          phone: s.phone,
          description: s.description,
          ownerId: owner.id,
          services: {
            create: s.services
          },
          stylists: {
            create: [
              { name: 'Akosua Pokuaa', role: 'Master Braider & Loc Specialist', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Knotless Braids', 'Fulani Braids', 'Goddess Locs'] },
              { name: 'Ama Serwaa', role: 'Nail & Ankara Artist', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400', rating: 4.8, specialties: ['Ankara Art', 'Gel Extensions', 'Spa Pedicures'] },
              { name: 'Abena Osei', role: 'Melanin Skincare Specialist', image: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Shea Butter Facials', 'Melanin Glow', 'Chemical Peels'] },
              { name: 'Yaa Asantewaa', role: 'Afro Glam & Gele Styling Artist', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', rating: 4.8, specialties: ['Gele Styling', 'Bridal Glam', 'Editorial Beats'] },
              { name: 'Kofi Boakye', role: 'Barbering & Afro Precision Cut Specialist', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Afro Fade', 'Sharp Line-up', 'Beard Grooming'] },
              { name: 'Adwoa Kyei', role: 'Wig Customization & Silk Press Specialist', image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Wig Melt', 'Silk Press', 'Frontal Customization'] }
            ]
          }
        }
      });
      
      // Add some reviews to the newly created salon
      await prisma.review.createMany({
        data: [
          { salonId: salon.id, userId: client1.id, rating: 5, comment: 'Absolutely incredible experience!' },
          { salonId: salon.id, userId: client2.id, rating: 4, comment: 'Great services, very relaxing.' }
        ]
      });
      console.log(`Created salon: ${s.name}`);
    } else {
      console.log(`Salon already exists: ${s.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
