import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getSalons = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where: whereClause,
        include: { services: true, reviews: true },
        skip,
        take: limit,
      }),
      prisma.salon.count({ where: whereClause }),
    ]);

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
        services: true,
        stylists: true,
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
      where: { salonId: String(id) },
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
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      include: { services: true, stylists: true },
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
 * Returns all appointments booked AT the owner's salon(s) — with full customer,
 * service, and stylist details. This is the correct data source for the Dashboard.
 */
export const getSalonOwnerAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

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
          salon:   { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true, duration: true, category: true } },
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
