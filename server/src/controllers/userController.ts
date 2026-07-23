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

    // Check if user exists by auth0Id
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    // If not found by auth0Id, check by email (in case they logged in with a different provider)
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        console.log('Syncing existing user with new auth0Id:', email, auth0Id);
        user = await prisma.user.update({
          where: { email },
          data: { auth0Id },
        });
      }
    }

    // If still not found, create them
    if (!user) {
      const safeEmail = email || `${auth0Id}@placeholder.salonbook.com`;
      const safeName = name || 'User';
      const initialRole = safeEmail.toLowerCase() === 'mikwanart7@gmail.com' ? 'ADMIN' : 'CLIENT';
      
      console.log('Creating new user:', safeEmail, safeName, 'Role:', initialRole);
      user = await prisma.user.create({
        data: {
          auth0Id,
          email: safeEmail,
          name: safeName,
          role: initialRole,
        },
      });
    } else if (user.email.toLowerCase() === 'mikwanart7@gmail.com' && user.role !== 'ADMIN') {
      console.log('Promoting mikwanart7@gmail.com to ADMIN role in DB');
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
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
