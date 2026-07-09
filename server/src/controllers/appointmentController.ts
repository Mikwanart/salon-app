import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { salonId, serviceId, stylistId, date, notes } = req.body;

    if (!salonId || !serviceId || !date) {
      res.status(400).json({ error: 'Salon ID, Service ID, and Date are required' });
      return;
    }

    // Get the internal user ID using the Auth0 ID
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User profile not found. Please sync user first.' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        notes,
        clientId: user.id,
        salonId,
        serviceId,
        stylistId: stylistId || null,
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const getMyAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: { clientId: user.id },
      include: {
        salon: {
          select: { name: true, address: true, city: true }
        },
        service: {
          select: { name: true, price: true, duration: true }
        },
        stylist: {
          select: { name: true, role: true }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid appointment ID' });
      return;
    }
    const { date, status } = req.body;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find the appointment first to check ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (appointment.clientId !== user.id) {
      res.status(403).json({ error: 'You are not authorized to update this appointment' });
      return;
    }

    const updateData: any = {};
    if (date) {
      updateData.date = new Date(date);
    }
    if (status) {
      // Validate status against Prisma enum values
      if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
        res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${Object.values(AppointmentStatus).join(', ')}` });
        return;
      }
      updateData.status = status as AppointmentStatus;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        salon: {
          select: { name: true, address: true, city: true }
        },
        service: {
          select: { name: true, price: true, duration: true }
        },
        stylist: {
          select: { name: true, role: true }
        }
      }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};
