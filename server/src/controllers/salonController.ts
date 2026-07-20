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

    // Basic pagination support
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
          include: {
            user: {
              select: { name: true }
            }
          }
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
