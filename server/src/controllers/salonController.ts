import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getSalons = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    
    // Basic filtering logic
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    // If we wanted to filter by service category, we would add it here

    const salons = await prisma.salon.findMany({
      where: whereClause,
      include: {
        services: true,
        reviews: true,
      },
    });

    res.json(salons);
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
