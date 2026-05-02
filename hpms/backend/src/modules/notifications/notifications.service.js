export const NotificationService = {
  send: async ({ type, userId, requestId, channel, payload }) => {
    console.log(`[NOTIFICATION] Channel: ${channel} | Type: ${type} | User: ${userId} | Request: ${requestId}`);
    console.log(`[NOTIFICATION] Payload:`, payload);

    try {
      // In real DB, we would save this to the Notification table
      const { db } = await import('../../config/db.js');
      const notification = await db.notification.create({
        data: {
          type,
          userId,
          requestId,
          channel,
          payload,
          recipient: payload.recipient || 'unknown',
          sentAt: new Date() // Sync for now
        }
      });
      return notification;
    } catch (err) {
      console.error('[NOTIFICATION ERROR]', err);
    }
  }
};
