import { Role } from '@prisma/client';
import { prisma } from './prisma';

export async function autoSeedSalons() {
  try {
    const existingCount = await prisma.salon.count();
    if (existingCount > 0) {
      // DB already has data — do nothing. Sync is no longer automatic.
      return;
    }


    console.log('🌱 Database is empty. Seeding default African salons...');

    const owner1 = await prisma.user.upsert({
      where: { email: 'owner@lumiere.com' },
      update: {},
      create: {
        auth0Id: 'auth0|owner-1',
        email: 'owner@lumiere.com',
        name: 'Maame Akua (Owner)',
        role: Role.SALON_OWNER,
      },
    });

    const owner2 = await prisma.user.upsert({
      where: { email: 'owner.ebony@lumiere.com' },
      update: {},
      create: {
        auth0Id: 'auth0|owner-2',
        email: 'owner.ebony@lumiere.com',
        name: 'Ama Mensah (Owner)',
        role: Role.SALON_OWNER,
      },
    });

    const owner3 = await prisma.user.upsert({
      where: { email: 'owner.akoma@lumiere.com' },
      update: {},
      create: {
        auth0Id: 'auth0|owner-3',
        email: 'owner.akoma@lumiere.com',
        name: 'Zola Nkem (Owner)',
        role: Role.SALON_OWNER,
      },
    });

    const owner4 = await prisma.user.upsert({
      where: { email: 'owner.obaahema@lumiere.com' },
      update: {},
      create: {
        auth0Id: 'auth0|owner-4',
        email: 'owner.obaahema@lumiere.com',
        name: 'Nia Okafor (Owner)',
        role: Role.SALON_OWNER,
      },
    });



    const client1 = await prisma.user.upsert({
      where: { email: 'jessica@example.com' },
      update: {},
      create: {
        auth0Id: 'auth0|client-1',
        email: 'jessica@example.com',
        name: 'Akosua M.',
        role: Role.CLIENT,
      },
    });

    const client2 = await prisma.user.upsert({
      where: { email: 'maria@example.com' },
      update: {},
      create: {
        auth0Id: 'auth0|client-2',
        email: 'maria@example.com',
        name: 'Esi K.',
        role: Role.CLIENT,
      },
    });

    const salonsData = [
      {
        ownerId: owner1.id,
        name: 'Maame Akua Braiding Salon',
        image: '/images/salon-3.jpg',
        address: '14 Independence Ave',
        city: 'Cantonments, Accra',
        state: 'Greater Accra',
        zip: '00233',
        phone: '+233 24 555 0142',
        description: 'Award-winning luxury African hair braiding lounge offering premium knotless braids, Fulani styles, locs, and scalp protection care in Cantonments, Accra.',
        services: [
          { name: 'Braiding & Locs', category: 'Haircare', price: 250, duration: 180, description: 'Neat, lightweight knotless braids and loc installations crafted with scalp protection and seamless parting.', image: '/images/service-braids.jpg' },
          { name: 'Ankara Art Manicure', category: 'Nail Art', price: 90, duration: 60, description: 'Vivid African print nail designs featuring hand-painted geometric wax motifs and hand spa treatment.', image: '/images/service-nails.jpg' },
          { name: 'Wigs & Styling', category: 'Haircare', price: 150, duration: 90, description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.', image: '/images/service-wigs.jpg' },
          { name: 'Natural Hair Care', category: 'Haircare', price: 200, duration: 75, description: 'Deep hydration treatments, scalp steam conditioning, natural coil definition, and moisture lock care.', image: '/images/service-natural.jpg' }
        ]
      },
      {
        ownerId: owner2.id,
        name: 'Osu Ebony & Gold Hair Studio',
        image: '/images/salon-2.jpg',
        address: '42 Ring Road East',
        city: 'Osu, Accra',
        state: 'Greater Accra',
        zip: '00233',
        phone: '+233 20 555 0198',
        description: 'A modern, chic African beauty sanctuary specializing in natural hair care, Ankara nail art, and precision styling in Osu.',
        services: [
          { name: 'Wigs & Styling', category: 'Haircare', price: 150, duration: 90, description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.', image: '/images/service-wigs.jpg' },
          { name: 'Natural Hair Care', category: 'Haircare', price: 200, duration: 75, description: 'Deep hydration treatments, scalp steam conditioning, natural coil definition, and moisture lock care.', image: '/images/service-natural.jpg' },
          { name: 'Fulani Braids with Beads', category: 'Haircare', price: 220, duration: 150, description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.', image: '/images/service-braids.jpg' },
          { name: 'Goddess Locs', category: 'Haircare', price: 280, duration: 210, description: 'Boho chic faux locs with curly wavy ends for an effortless regal crown.', image: '/images/service-braids.jpg' }
        ]
      },
      {
        ownerId: owner3.id,
        name: 'Akoma Spa & Beauty Sanctuary',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
        address: '88 Lagos Avenue',
        city: 'East Legon, Accra',
        state: 'Greater Accra',
        zip: '00233',
        phone: '+233 26 555 0167',
        description: 'An exclusive spa and beauty destination focused on holistic African hair care, Gele wrapping, and luxury pampering.',
        services: [
          { name: 'Fulani Braids with Beads', category: 'Haircare', price: 220, duration: 150, description: 'Authentic Fulani tribal braids embellished with wooden beads, brass cuffs, and shell accessories.', image: '/images/service-braids.jpg' },
          { name: 'Goddess Locs', category: 'Haircare', price: 280, duration: 210, description: 'Boho chic faux locs with curly wavy ends for an effortless regal crown.', image: '/images/service-braids.jpg' },
          { name: 'Afro Fade & Sharp Line-up', category: 'Barbering', price: 80, duration: 45, description: 'Precision razor fade cut, edge line-up, beard shaping, and hot towel scalp treatment.', image: '/images/service-barbering.jpg' },
          { name: 'Ghana Weaving & Cornrows', category: 'Haircare', price: 180, duration: 120, description: 'Sleek feed-in cornrows and custom Ghana weaving patterns using lightweight extensions.', image: '/images/service-braids.jpg' }
        ]
      },
      {
        ownerId: owner4.id,
        name: 'Obaahema Royalty Silk and Afro Salon',
        image: '/images/salon-1.jpg',
        address: '15 Kejetia Market Rd',
        city: 'Kejetia, Kumasi',
        state: 'Ashanti',
        zip: '00233',
        phone: '+233 27 555 0189',
        description: 'Boutique hair bar offering silk press treatments, loc maintenance, natural hair steam conditioning, and custom wig styling in Kejetia.',
        services: [
          { name: 'Ankara Art Manicure', category: 'Nail Art', price: 90, duration: 60, description: 'Vivid African print nail designs featuring hand-painted geometric wax motifs and hand spa treatment.', image: '/images/service-nails.jpg' },
          { name: 'Wigs & Styling', category: 'Haircare', price: 150, duration: 90, description: 'Custom wig installation, frontal melting, precision layer cuts, and luxury unit styling.', image: '/images/service-wigs.jpg' },
          { name: 'Natural Hair Care', category: 'Haircare', price: 200, duration: 75, description: 'Deep hydration treatments, scalp steam conditioning, natural coil definition, and moisture lock care.', image: '/images/service-natural.jpg' }
        ]
      }
    ];

    for (const s of salonsData) {
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
          ownerId: s.ownerId,
          services: { create: s.services },
          stylists: {
            create: [
              { name: 'Akosua Pokuaa', role: 'Master Braider & Loc Specialist', image: '/stylists/2CzySFQXCn7b9cwTICoc_.jpg', rating: 4.9, specialties: ['Knotless Braids', 'Fulani Braids', 'Goddess Locs'] },
              { name: 'Ama Serwaa', role: 'Nail & Ankara Artist', image: '/stylists/LlcsU7WHjgJpAlru3401_.jpg', rating: 4.8, specialties: ['Ankara Art', 'Gel Extensions'] },
              { name: 'Abena Osei', role: 'Melanin Skincare Specialist', image: '/stylists/OgRb8FZ4e4Gk_P9-oI6NK.jpg', rating: 4.9, specialties: ['Shea Butter Facials', 'Melanin Glow'] },
              { name: 'Yaa Asantewaa', role: 'Afro Glam Artist', image: '/stylists/Photo by Horci via Iwaria.jpg', rating: 4.8, specialties: ['Gele Styling', 'Bridal Glam'] }
            ]
          }
        }
      });

      await prisma.review.createMany({
        data: [
          { salonId: salon.id, userId: client1.id, rating: 5, comment: 'Absolutely incredible African styling experience!' },
          { salonId: salon.id, userId: client2.id, rating: 5, comment: 'Painless braiding and top notch hospitality.' }
        ]
      });
    }

    console.log('✅ Default African salons auto-seeded successfully!');
  } catch (err) {
    console.error('Failed to auto-seed salons:', err);
  }
}
