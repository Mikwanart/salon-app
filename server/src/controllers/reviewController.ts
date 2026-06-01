import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { salonId, rating, comment } = req.body;

    if (!salonId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Salon ID and a valid rating (1-5) are required' });
      return;
    }

    // Get the internal user ID using the Auth0 ID
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User profile not found. Please sync user first.' });
      return;
    }

    // Check if the salon exists
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    // Create the review in the database
    const review = await prisma.review.create({
      data: {
        rating: Math.round(rating),
        comment,
        userId: user.id,
        salonId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};
