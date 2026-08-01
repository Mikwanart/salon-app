import cron from 'node-cron';
import { prisma } from './prisma';
import { notificationService } from './notifications';

/**
 * Finds appointments happening roughly 24 hours from now that haven't had a
 * reminder sent yet, sends the reminder, and marks them so they're never
 * reminded twice — even if this job's window overlaps between runs.
 */
export const sendDueReminders = async (): Promise<number> => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: windowStart, lte: windowEnd },
      status: { not: 'CANCELLED' },
      reminderSentAt: null,
    },
    include: { client: true, salon: true, service: true, stylist: true },
  });

  for (const appointment of dueAppointments) {
    try {
      await notificationService.sendAppointmentReminder(appointment);
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    } catch (err) {
      console.error(`Failed to send reminder for appointment ${appointment.id}:`, err);
    }
  }

  if (dueAppointments.length > 0) {
    console.log(`⏰ Sent ${dueAppointments.length} appointment reminder(s).`);
  }

  return dueAppointments.length;
};

/**
 * Starts the background job that checks for due reminders every 30 minutes.
 * Also runs once shortly after startup, so a server restart doesn't leave
 * reminders waiting up to 30 minutes before the first check.
 */
export const startReminderScheduler = (): void => {
  cron.schedule('*/30 * * * *', () => {
    sendDueReminders().catch((err) => console.error('Reminder scheduler error:', err));
  });

  console.log('⏰ Appointment reminder scheduler started (checks every 30 minutes).');

  setTimeout(() => {
    sendDueReminders().catch((err) => console.error('Reminder scheduler error:', err));
  }, 10_000);
};
