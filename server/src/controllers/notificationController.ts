import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const getRequestingUser = async (req: Request) => {
  const auth0Id = req.auth?.payload.sub;
  if (!auth0Id) return null;
  return prisma.user.findUnique({ where: { auth0Id: auth0Id as string } });
};

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getRequestingUser(req);
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getRequestingUser(req);
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

export const clearMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getRequestingUser(req);
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    await prisma.notification.deleteMany({ where: { userId: user.id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};
