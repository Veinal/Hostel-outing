import cron from 'node-cron';
import { db } from '../config/db.js';
import { NotificationService } from '../modules/notifications/notifications.service.js';

export const scheduleOverdueCheck = () => {
  cron.schedule('*/15 * * * *', async () => {
    await runOverdueCheck();
  });
};

export const runOverdueCheck = async () => {
  console.log('[CRON] Running overdue check...');
  try {
    const now = new Date();
    const expiredCerts = await db.approvalCertificate.findMany({
      where: {
        status: 'STEPPED_OUT',
        request: {
          expectedReturnDateTime: { lt: now }
        }
      },
      include: { request: true }
    });

    for (const cert of expiredCerts) {
      await db.$transaction([
        db.approvalCertificate.update({
          where: { id: cert.id },
          data: { status: 'EXPIRED' }
        }),
        db.outingRequest.update({
          where: { id: cert.requestId },
          data: { status: 'OVERDUE' }
        })
      ]);

      await NotificationService.send({
        type: 'OVERDUE_ALERT',
        userId: cert.request.wardenId,
        requestId: cert.requestId,
        channel: 'SYSTEM',
        payload: { message: `Request ${cert.request.approvalNumber} is overdue!` }
      });
    }

    console.log(`[CRON] Overdue check complete. Processed ${expiredCerts.length} records.`);
    return expiredCerts.length;
  } catch (err) {
    console.error('[CRON ERROR]', err);
    return 0;
  }
};
