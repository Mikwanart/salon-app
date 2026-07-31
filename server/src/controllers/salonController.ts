import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { autoSeedSalons } from '../lib/autoSeed';

/**
 * Robust helper to retrieve user from DB via auth0Id with automatic email fallback
 */
export const getUserFromReq = async (req: Request) => {
  const auth0Id = req.auth?.payload.sub;
  if (!auth0Id) return null;

  let user = await prisma.user.findUnique({ where: { auth0Id } });
  if (!user) {
    // Attempt fallback lookup by email claim if present in token payload
    const email = (req.auth?.payload.email || req.auth?.payload['https://salon-api/email']) as string | undefined;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { auth0Id }
        });
      }
    }
  }
  return user;
};

export const getSalons = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = { status: 'APPROVED' };
    if (search) {
      whereClause.AND = [
        { status: 'APPROVED' },
        {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { city: { contains: String(search), mode: 'insensitive' } },
          ],
        },
      ];
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    let [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where: whereClause,
        include: { services: true, reviews: true, stylists: true },
        skip,
        take: limit,
      }),
      prisma.salon.count({ where: whereClause }),
    ]);

    // Only auto-seed when the DB is completely empty (first run only)
    if (total === 0 && !search) {
      console.log('🌱 Database empty. Auto-seeding initial salons...');
      try {
        await autoSeedSalons();
      } catch (seedErr) {
        console.error('Auto-seed failed (non-fatal):', seedErr);
      }
      [salons, total] = await Promise.all([
        prisma.salon.findMany({
          where: whereClause,
          include: { services: true, reviews: true, stylists: true },
          skip,
          take: limit,
        }),
        prisma.salon.count({ where: whereClause }),
      ]);
    }

    res.json({ data: salons, total, page, limit });
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({ error: 'Failed to fetch salons' });
  }
};

export const getSalonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const salon = await prisma.salon.findUnique({
      where: { id: String(id) },
      include: {
        services: { where: { isActive: true } },
        stylists: { where: { isActive: true } },
        reviews: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    res.json(salon);
  } catch (error) {
    console.error('Error fetching salon details:', error);
    res.status(500).json({ error: 'Failed to fetch salon details' });
  }
};

export const getSalonServices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const services = await prisma.service.findMany({
      where: { salonId: String(id), isActive: true },
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching salon services:', error);
    res.status(500).json({ error: 'Failed to fetch salon services' });
  }
};

/**
 * Returns the salon owned by the currently logged-in user.
 * Used by the Dashboard header to show salon name and info.
 */
export const getSalonOwnerSalon = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User profile not found. Please log in again.' }); return; }

    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      include: {
        services: { where: { isActive: true } },
        stylists: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!salon) {
      res.status(404).json({ error: 'No salon found for this owner' });
      return;
    }

    res.json(salon);
  } catch (error) {
    console.error('Error fetching owner salon:', error);
    res.status(500).json({ error: 'Failed to fetch owner salon' });
  }
};

/**
 * Returns all salons owned by the currently logged-in user.
 * Enables multi-salon owners to switch between their salons.
 */
export const getSalonOwnerSalons = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User profile not found. Please log in again.' }); return; }

    const salons = await prisma.salon.findMany({
      where: { ownerId: user.id },
      include: {
        services: { where: { isActive: true } },
        stylists: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(salons);
  } catch (error) {
    console.error('Error fetching owner salons:', error);
    res.status(500).json({ error: 'Failed to fetch owner salons' });
  }
};

/**
 * Returns all appointments booked AT the owner's salon(s) — with full customer,
 * service, and stylist details. This is the correct data source for the Dashboard.
 */
export const getSalonOwnerAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User profile not found' }); return; }

    // Find all salons owned by this user
    const salons = await prisma.salon.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const salonIds = salons.map(s => s.id);

    if (salonIds.length === 0) {
      res.json({ data: [], total: 0, page: 1, limit: 50 });
      return;
    }

    const page  = Math.max(1, parseInt(String(req.query.page  || '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const skip  = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { salonId: { in: salonIds } },
        include: {
          client:  { select: { id: true, name: true, email: true, phone: true } },
          salon:   { select: { id: true, name: true, image: true } },
          service: { select: { id: true, name: true, price: true, duration: true, category: true, image: true } },
          stylist: { select: { id: true, name: true, role: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where: { salonId: { in: salonIds } } }),
    ]);

    res.json({ data: appointments, total, page, limit });
  } catch (error) {
    console.error('Error fetching salon owner appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

/**
 * Update the owner's salon details
 */
export const updateSalonOwnerSalon = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { salonId, name, description, address, city, state, zipCode, phone, coverImage } = req.body;
    const targetId = salonId || req.query.salonId;
    const salon = targetId
      ? await prisma.salon.findFirst({ where: { id: String(targetId), ownerId: user.id } })
      : await prisma.salon.findFirst({ where: { ownerId: user.id } });

    if (!salon) { res.status(404).json({ error: 'No salon found' }); return; }

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: { name, description, address, city, state, zip: zipCode, phone, image: coverImage },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating salon:', error);
    res.status(500).json({ error: 'Failed to update salon' });
  }
};

/**
 * Create a new service for the owner's salon
 */
export const createSalonService = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { salonId, name, category, description, price, duration } = req.body;
    const targetId = salonId || req.query.salonId;
    const salon = targetId
      ? await prisma.salon.findFirst({ where: { id: String(targetId), ownerId: user.id } })
      : await prisma.salon.findFirst({ where: { ownerId: user.id } });

    if (!salon) { res.status(404).json({ error: 'No salon found' }); return; }

    const service = await prisma.service.create({
      data: { name, category, description, price, duration, salonId: salon.id },
    });

    res.json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

/**
 * Update an existing service for the owner's salon
 */
export const updateSalonService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const service = await prisma.service.findUnique({ where: { id: String(id) }, include: { salon: true } });
    if (!service || service.salon.ownerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to edit this service' }); return;
    }

    const { name, category, description, price, duration } = req.body;

    const updated = await prisma.service.update({
      where: { id: String(id) },
      data: { name, category, description, price, duration },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

/**
 * Soft delete a service
 */
export const deleteSalonService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const service = await prisma.service.findUnique({ where: { id: String(id) }, include: { salon: true } });
    if (!service || service.salon.ownerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to delete this service' }); return;
    }

    await prisma.service.update({
      where: { id: String(id) },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

/**
 * Create a new stylist
 */
export const createSalonStylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { salonId, name, role, image, specialties } = req.body;
    const targetId = salonId || req.query.salonId;
    const salon = targetId
      ? await prisma.salon.findFirst({ where: { id: String(targetId), ownerId: user.id } })
      : await prisma.salon.findFirst({ where: { ownerId: user.id } });

    if (!salon) { res.status(404).json({ error: 'No salon found' }); return; }

    const stylist = await prisma.stylist.create({
      data: { name, role, image, specialties: specialties || [], salonId: salon.id },
    });

    res.json(stylist);
  } catch (error) {
    console.error('Error creating stylist:', error);
    res.status(500).json({ error: 'Failed to create stylist' });
  }
};

/**
 * Update an existing stylist
 */
export const updateSalonStylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const stylist = await prisma.stylist.findUnique({ where: { id: String(id) }, include: { salon: true } });
    if (!stylist || stylist.salon.ownerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to edit this stylist' }); return;
    }

    const { name, role, image, specialties } = req.body;

    const updated = await prisma.stylist.update({
      where: { id: String(id) },
      data: { name, role, image, specialties },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({ error: 'Failed to update stylist' });
  }
};

/**
 * Soft delete a stylist
 */
export const deleteSalonStylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserFromReq(req);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const stylist = await prisma.stylist.findUnique({ where: { id: String(id) }, include: { salon: true } });
    if (!stylist || stylist.salon.ownerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to delete this stylist' }); return;
    }

    await prisma.stylist.update({
      where: { id: String(id) },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting stylist:', error);
    res.status(500).json({ error: 'Failed to delete stylist' });
  }
};

export const registerSalon = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromReq(req);
    if (!user) { 
      console.log('Register failed: User profile not found');
      res.status(404).json({ error: 'User profile not found. Please log in again.' }); 
      return; 
    }

    const { name, address, city, state, phone, email, image, coverImage } = req.body;
    if (!name || !address || !city || !state) {
      console.log('Register failed: Missing required fields', req.body);
      res.status(400).json({ error: 'Missing required fields: name, address, city, and state are required.' });
      return;
    }

    // Determine initial salon status based on user role
    const initialStatus = user.role === 'SALON_OWNER' || user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const salon = await prisma.salon.create({
      data: {
        name,
        address,
        city,
        state,
        phone,
        email,
        image: image || coverImage || null,
        status: initialStatus,
        ownerId: user.id
      }
    });

    if (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SALON_OWNER' }
      });
    }

    res.status(201).json(salon);
  } catch (error) {
    console.error('Error registering salon:', error);
    res.status(500).json({ error: 'Failed to register salon' });
  }
};
