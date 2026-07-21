import { Role } from '@prisma/client';
import { prisma } from './prisma';

export async function autoSeedSalons() {
  try {
    const existingCount = await prisma.salon.count();
    if (existingCount > 0) {
      return;
    }

    console.log('🌱 Database is empty. Seeding default salons...');

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

    const salonsData = [
      {
        name: 'Lumiere Beauty Studio',
        image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800',
        address: '9630 Santa Monica Blvd',
        city: 'Beverly Hills',
        state: 'CA',
        zip: '90210',
        phone: '(310) 555-0142',
        description: 'Award-winning luxury beauty studio offering premium hair, nail, and skincare services in the heart of Beverly Hills.',
        services: [
          { name: 'Precision Haircuts', category: 'Haircare', price: 65, duration: 45, description: 'Expert precision cuts tailored to your face shape and personal style.' },
          { name: 'Artistic Manicures', category: 'Nail Art', price: 45, duration: 60, description: 'Creative nail art and luxurious hand treatments for a stunning finish.' },
          { name: 'Revitalizing Facials', category: 'Skincare', price: 90, duration: 75, description: 'Deep cleansing and rejuvenating facial treatments for radiant skin.' },
          { name: 'Glamour Makeup', category: 'Makeup', price: 85, duration: 60, description: 'Professional makeup artistry for weddings, events, and everyday glam.' }
        ]
      },
      {
        name: 'The Velvet Chair',
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
        address: '350 S Grand Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90071',
        phone: '(213) 555-0198',
        description: 'A modern, chic salon specializing in cutting-edge hair techniques and artisan nail services.',
        services: [
          { name: 'Revitalizing Facials', category: 'Skincare', price: 90, duration: 75, description: 'Deep cleansing and rejuvenating facial treatments for radiant skin.' },
          { name: 'Glamour Makeup', category: 'Makeup', price: 85, duration: 60, description: 'Professional makeup artistry for weddings, events, and everyday glam.' },
          { name: 'Balayage Coloring', category: 'Haircare', price: 150, duration: 120, description: 'Seamless, sun-kissed balayage coloring for a natural dimensional look.' },
          { name: 'Gel Extensions', category: 'Nail Art', price: 70, duration: 90, description: 'Long-lasting gel nail extensions with flawless application.' }
        ]
      },
      {
        name: 'Pure Aura Spa',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
        address: '1201 Abbot Kinney Blvd',
        city: 'Venice',
        state: 'CA',
        zip: '90291',
        phone: '(424) 555-0167',
        description: 'An exclusive spa and beauty destination focused on holistic beauty treatments.',
        services: [
          { name: 'Balayage Coloring', category: 'Haircare', price: 150, duration: 120, description: 'Seamless, sun-kissed balayage coloring for a natural dimensional look.' },
          { name: 'Gel Extensions', category: 'Nail Art', price: 70, duration: 90, description: 'Long-lasting gel nail extensions with flawless application.' },
          { name: 'Chemical Peel', category: 'Skincare', price: 120, duration: 45, description: 'Clinical-grade chemical peels to smooth texture and brighten skin tone.' },
          { name: 'Bridal Makeup', category: 'Makeup', price: 200, duration: 90, description: 'Complete bridal beauty package with trial session included.' }
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
          ownerId: owner.id,
          services: { create: s.services },
          stylists: {
            create: [
              { name: 'Emma Laurent', role: 'Senior Stylist', image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Balayage', 'Precision Cuts', 'Bridal'] },
              { name: 'Sofia Chen', role: 'Nail Artist', image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400', rating: 4.8, specialties: ['Gel Art', 'French Tips', '3D Nail Art'] },
              { name: 'Olivia Martinez', role: 'Skincare Specialist', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', rating: 4.9, specialties: ['Chemical Peels', 'Hydrafacials', 'Anti-Aging'] },
              { name: 'Chloe Williams', role: 'Makeup Artist', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400', rating: 4.7, specialties: ['Bridal', 'Editorial', 'Special FX'] }
            ]
          }
        }
      });

      await prisma.review.createMany({
        data: [
          { salonId: salon.id, userId: client1.id, rating: 5, comment: 'Absolutely incredible experience!' },
          { salonId: salon.id, userId: client2.id, rating: 4, comment: 'Great services, very relaxing.' }
        ]
      });
    }

    console.log('✅ Default salons auto-seeded successfully!');
  } catch (err) {
    console.error('Failed to auto-seed salons:', err);
  }
}
