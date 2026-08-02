import { prisma } from './prisma';
import { emitToUser } from './socket';

export interface NotifyOptions {
  title?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  link?: string;
  appointmentId?: string;
  status?: string;
  salonName?: string;
  actions?: ('accept' | 'decline')[];
}

/**
 * Creates a persistent notification row for a user and immediately pushes it
 * to them in real time over WebSockets, if they're currently connected.
 * If they're offline, the row is still there next time they fetch their history.
 */
export const notifyUser = async (
  userId: string,
  message: string,
  options: NotifyOptions = {}
) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      message,
      title: options.title,
      type: options.type || 'info',
      link: options.link,
    },
  });

  // Extra context (appointmentId, status, actions) isn't part of the
  // persisted schema, but is useful to the frontend for rendering
  // interactive notifications right when they arrive.
  emitToUser(userId, 'notification:new', {
    ...notification,
    appointmentId: options.appointmentId,
    status: options.status,
    salonName: options.salonName,
    actions: options.actions,
  });

  return notification;
};
