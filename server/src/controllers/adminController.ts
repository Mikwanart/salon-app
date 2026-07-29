import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get platform-wide statistics for the admin dashboard
 */
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalClients,
      totalOwners,
      totalAdmins,
      totalSalons,
      approvedSalons,
      pendingSalons,
      rejectedSalons,
      totalAppointments,
      completedAppointments,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'SALON_OWNER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.salon.count(),
      prisma.salon.count({ where: { status: 'APPROVED' } }),
      prisma.salon.count({ where: { status: 'PENDING' } }),
      prisma.salon.count({ where: { status: 'REJECTED' } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.findMany({
        where: { status: 'COMPLETED' },
        include: { service: { select: { price: true } } },
      }),
    ]);

    const totalRevenue = revenueResult.reduce((sum, app) => sum + (app.service?.price || 0), 0);



    res.json({
      users: {
        total: totalUsers,
        clients: totalClients,
        owners: totalOwners,
        admins: totalAdmins,
      },
      salons: {
        total: totalSalons,
        approved: approvedSalons,
        pending: pendingSalons,
        rejected: rejectedSalons,
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
      },
      financials: {
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
};

/**
 * Get all salons with status filter and search query
 */
export const getAdminSalons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = String(status).toUpperCase();
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where: whereClause,
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          _count: {
            select: { services: true, appointments: true, stylists: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salon.count({ where: whereClause }),
    ]);

    res.json({ data: salons, total, page, limit });
  } catch (error) {
    console.error('Error fetching admin salons:', error);
    res.status(500).json({ error: 'Failed to fetch salons' });
  }
};

/**
 * Update a salon's approval status (APPROVED / REJECTED / PENDING)
 */
export const updateSalonStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be APPROVED, REJECTED, or PENDING' });
      return;
    }

    const salon = await prisma.salon.findUnique({ where: { id: String(id) } });
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    const updatedSalon = await prisma.salon.update({
      where: { id: String(id) },
      data: { status: status as any },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updatedSalon);
  } catch (error) {
    console.error('Error updating salon status:', error);
    res.status(500).json({ error: 'Failed to update salon status' });
  }
};

/**
 * Get all platform users with role filter and search query
 */
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (role && role !== 'ALL') {
      whereClause.role = String(role).toUpperCase();
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          auth0Id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          _count: { select: { bookings: true, salons: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({ data: users, total, page, limit });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Update a user's role (CLIENT / SALON_OWNER / ADMIN)
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CLIENT', 'SALON_OWNER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be CLIENT, SALON_OWNER, or ADMIN' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: { role: role as any },
      select: {
        id: true,
        auth0Id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

/**
 * Get all appointments platform-wide
 */
export const getAdminAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = String(status).toUpperCase();
    }
    if (search) {
      whereClause.OR = [
        { client: { name: { contains: String(search), mode: 'insensitive' } } },
        { client: { email: { contains: String(search), mode: 'insensitive' } } },
        { salon: { name: { contains: String(search), mode: 'insensitive' } } },
        { service: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          salon: { select: { id: true, name: true, city: true } },
          service: { select: { id: true, name: true, price: true, duration: true } },
          stylist: { select: { id: true, name: true, role: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where: whereClause }),
    ]);

    res.json({ data: appointments, total, page, limit });
  } catch (error) {
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
