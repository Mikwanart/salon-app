import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppointmentStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { momoService } from '../lib/momo';
import { notificationService } from '../lib/notifications';

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { 
      salonId, 
      serviceId, 
      stylistId, 
      date, 
      notes, 
      paymentMethod, 
      paymentStatus, 
      paymentDetails, 
      transactionId 
    } = req.body;

    if (!salonId || !serviceId || !date) {
      res.status(400).json({ error: 'Salon ID, Service ID, and Date are required' });
      return;
    }

    // Validate payment enums if provided
    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      res.status(400).json({ error: `Invalid payment method: ${paymentMethod}` });
      return;
    }
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ error: `Invalid payment status: ${paymentStatus}` });
      return;
    }

    // Get the internal user ID using the Auth0 ID
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User profile not found. Please sync user first.' });
      return;
    }

    // Real MTN MoMo Collection trigger
    let momoTxnId: string | null = null;
    if (paymentMethod === 'MOMO') {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      const phoneForMomo = paymentDetails || user.phone || '';
      if (!phoneForMomo) {
        res.status(400).json({ error: 'Phone number is required for MTN MoMo payment' });
        return;
      }

      momoTxnId = crypto.randomUUID();

      try {
        await momoService.requestToPay(momoTxnId, service.price.toString(), phoneForMomo);
      } catch (err: any) {
        console.error('Failed to trigger request to pay on MTN gateway:', err);
        res.status(502).json({ error: `MTN MoMo API Error: ${err.message || 'Failed to initiate charge request'}` });
        return;
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        notes,
        clientId: user.id,
        salonId,
        serviceId,
        stylistId: stylistId || null,
        paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
        paymentStatus: paymentMethod === 'MOMO' ? 'PENDING' : (paymentStatus ? (paymentStatus as PaymentStatus) : undefined),
        paymentDetails: paymentMethod === 'MOMO' ? (paymentDetails || null) : (paymentDetails || null),
        transactionId: paymentMethod === 'MOMO' ? momoTxnId : (transactionId || null),
      },
    });

    // Notify salon owner of new booking request
    triggerOwnerNewBookingNotification(appointment.id);

    if (appointment.paymentMethod === 'CASH' || appointment.paymentMethod === 'CARD') {
      triggerConfirmationNotification(appointment.id);
    }

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

    // Basic pagination support
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where: { clientId: user.id } }),
    ]);

    res.json({ data: appointments, total, page, limit });
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
    const { date, status, paymentStatus } = req.body;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find the appointment first to check ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { salon: { select: { ownerId: true } } }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (appointment.clientId !== user.id && appointment.salon.ownerId !== user.id) {
      res.status(403).json({ error: 'You are not authorized to update this appointment' });
      return;
    }

    const updateData: any = {};
    if (date) {
      updateData.date = new Date(date);
    }
    if (paymentStatus) {
      if (!Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
        res.status(400).json({ error: `Invalid payment status: ${paymentStatus}` });
        return;
      }
      updateData.paymentStatus = paymentStatus as PaymentStatus;
    }
    if (status) {
      // Validate status against Prisma enum values
      if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
        res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${Object.values(AppointmentStatus).join(', ')}` });
        return;
      }
      updateData.status = status as AppointmentStatus;

      // Auto-refund logic
      if (
        status === 'CANCELLED' &&
        appointment.paymentStatus === 'PAID' &&
        (appointment.paymentMethod === 'MOMO' || appointment.paymentMethod === 'CARD')
      ) {
        updateData.paymentStatus = PaymentStatus.REFUNDED;
      }
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

    if (status === 'CONFIRMED') {
      triggerAcceptedNotification(updatedAppointment.id);
    } else if (status === 'CANCELLED') {
      triggerCancellationNotification(updatedAppointment.id);
    }

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const verifyPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Appointment ID is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (appointment.clientId !== user.id) {
      res.status(403).json({ error: 'Unauthorized access to appointment' });
      return;
    }

    // If it's cash or already paid, return early
    if (appointment.paymentMethod === 'CASH') {
      res.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
      return;
    }

    if (appointment.paymentStatus === 'PAID' || appointment.paymentStatus === 'REFUNDED') {
      res.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
      return;
    }

    if (appointment.paymentMethod === 'MOMO' && appointment.transactionId) {
      try {
        const momoStatus = await momoService.getTransactionStatus(appointment.transactionId);
        
        let dbPaymentStatus: PaymentStatus = appointment.paymentStatus;
        let dbAppointmentStatus: AppointmentStatus = appointment.status;

        if (momoStatus === 'SUCCESSFUL') {
          dbPaymentStatus = PaymentStatus.PAID;
          dbAppointmentStatus = AppointmentStatus.CONFIRMED;
          triggerConfirmationNotification(appointment.id);
        } else if (momoStatus === 'FAILED') {
          dbPaymentStatus = PaymentStatus.FAILED;
          dbAppointmentStatus = AppointmentStatus.CANCELLED;
        }

        if (dbPaymentStatus !== appointment.paymentStatus || dbAppointmentStatus !== appointment.status) {
          await prisma.appointment.update({
            where: { id },
            data: {
              paymentStatus: dbPaymentStatus,
              status: dbAppointmentStatus,
            }
          });
        }

        res.json({ status: dbAppointmentStatus, paymentStatus: dbPaymentStatus });
        return;
      } catch (err) {
        console.error('Failed to verify status with MTN:', err);
        res.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
        return;
      }
    }

    res.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
  } catch (error) {
    console.error('Error verifying payment status:', error);
    res.status(500).json({ error: 'Failed to verify payment status' });
  }
};

// Helper functions for sending notifications asynchronously in the background
const triggerOwnerNewBookingNotification = async (appointmentId: string) => {
  try {
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        salon: {
          include: { owner: true }
        },
        stylist: true
      }
    });
    if (fullAppt) {
      await notificationService.sendOwnerNewBookingNotification(fullAppt);
    }
  } catch (err) {
    console.error('Failed to trigger owner new booking notification:', err);
  }
};

const triggerAcceptedNotification = async (appointmentId: string) => {
  try {
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        salon: true,
        stylist: true
      }
    });
    if (fullAppt) {
      await notificationService.sendBookingAccepted(fullAppt);
    }
  } catch (err) {
    console.error('Failed to trigger accepted notification:', err);
  }
};

const triggerConfirmationNotification = async (appointmentId: string) => {
  try {
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        salon: true,
        stylist: true
      }
    });
    if (fullAppt) {
      await notificationService.sendBookingConfirmation(fullAppt);
    }
  } catch (err) {
    console.error('Failed to trigger confirmation notification:', err);
  }
};

const triggerCancellationNotification = async (appointmentId: string) => {
  try {
    const fullAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        salon: true,
        stylist: true
      }
    });
    if (fullAppt) {
      await notificationService.sendBookingDeclined(fullAppt);
    }
  } catch (err) {
    console.error('Failed to trigger cancellation notification:', err);
  }
};

/**
 * Public endpoint — returns the list of booked time slots for a given salon on a given date.
 * Used by the booking page to prevent double-bookings.
 * Query params: salonId (required), date (required, format YYYY-MM-DD)
 */
export const getBookedSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { salonId, date } = req.query;

    if (!salonId || !date) {
      res.status(400).json({ error: 'salonId and date are required query parameters' });
      return;
    }

    // Build a UTC date range covering the full local day
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay   = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        salonId: String(salonId),
        status: { notIn: ['CANCELLED'] },
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: { date: true },
    });

    // Return hour:minute strings the frontend can compare against its time slots
    const slots = appointments.map((a) => {
      const d = new Date(a.date);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
};
