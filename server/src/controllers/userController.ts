import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const { email, name } = req.body;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    // If not, create them
    if (!user) {
      if (!email || !name) {
         res.status(400).json({ error: 'Email and name are required for new users' });
         return;
      }
      user = await prisma.user.create({
        data: {
          auth0Id,
          email,
          name,
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        bookings: {
          include: {
            salon: true,
            service: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};
