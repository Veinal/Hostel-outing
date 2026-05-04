import cron from 'node-cron';
import { db as prisma } from '../config/db.js';
import { NotificationService as notificationService } from '../modules/notifications/notifications.service.js';

export const scheduleOverdueCheck = () => {
  // Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    await runOverdueCheck();
  });
};

export const runOverdueCheck = async () => {
  const now = new Date();
  console.log(`[CRON] Running overdue check at ${now.toISOString()}`);

  try {
    // ── RULE 1: OUTING requests ──────────────────────────────
    // Expire all OUTING requests where:
    // - Request is APPROVED or certificate is ACTIVE/STEPPED_OUT
    // - outDateTime date is today or earlier
    // - Current time is past 23:59 of the outDateTime date
    
    // Find OUTING certificates that should be expired
    const overdueOutings = await prisma.approvalCertificate.findMany({
      where: {
        status: { in: ['ACTIVE', 'STEPPED_OUT'] },
        request: {
          requestType: 'OUTING',
          status: 'APPROVED',
          outDateTime: {
            // outDateTime date is before today (yesterday or earlier)
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      },
      include: {
        request: {
          include: {
            warden: { select: { id: true } }
          }
        }
      }
    });

    console.log(`[CRON] Found ${overdueOutings.length} overdue OUTING requests`);

    for (const cert of overdueOutings) {
      await prisma.$transaction([
        prisma.approvalCertificate.update({
          where: { id: cert.id },
          data: { status: 'EXPIRED' }
        }),
        prisma.outingRequest.update({
          where: { id: cert.requestId },
          data: { status: 'OVERDUE' }
        })
      ]);

      // Notify warden
      await notificationService.send({
        type: 'OVERDUE_ALERT',
        userId: cert.request.wardenId,
        requestId: cert.requestId,
        channel: 'IN_APP',
        payload: {
          message: `OUTING request ${cert.request.approvalNumber} has expired. Student did not return by end of day.`,
          studentId: cert.request.studentId
        }
      });
    }

    // ── RULE 2: HOME_GOING and OTHERS ───────────────────────
    // Do NOT expire these. Only alert warden if expected 
    // return time has passed and entry scan not done.
    
    const overdueHomeGoings = await prisma.approvalCertificate.findMany({
      where: {
        status: 'STEPPED_OUT',   // stepped out but not stepped in
        entryScannedAt: null,
        request: {
          requestType: { in: ['HOME_GOING', 'OTHERS'] },
          status: 'APPROVED',
          expectedReturnDateTime: { lt: now }
        }
      },
      include: {
        request: {
          include: {
            warden: { select: { id: true, fullName: true } }
          }
        }
      }
    });

    console.log(`[CRON] Found ${overdueHomeGoings.length} overdue HOME_GOING/OTHERS`);

    for (const cert of overdueHomeGoings) {
      // Only alert — do NOT change status
      // Avoid duplicate alerts: check if alert was sent in last 4 hours
      const recentAlert = await prisma.notification.findFirst({
        where: {
          requestId: cert.requestId,
          type: 'OVERDUE_ALERT',
          createdAt: {
            gt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
          }
        }
      });

      if (!recentAlert) {
        await notificationService.send({
          type: 'OVERDUE_ALERT',
          userId: cert.request.wardenId,
          requestId: cert.requestId,
          channel: 'IN_APP',
          payload: {
            message: `Student has not returned. Expected return was ${new Date(cert.request.expectedReturnDateTime).toLocaleString('en-IN')}.`,
            studentId: cert.request.studentId,
            approvalNumber: cert.request.approvalNumber
          }
        });
      }
    }

    // ── RULE 3: Late ENTRY scan notification ─────────────────
    // For OUTING: if entryScannedAt is after 19:00 on the same day
    // Notify warden of late return
    
    const lateReturns = await prisma.approvalCertificate.findMany({
      where: {
        status: 'COMPLETED',
        entryScannedAt: { not: null },
        request: {
          requestType: 'OUTING',
          status: 'COMPLETED'
        }
      },
      include: {
        request: {
          include: {
            warden: { select: { id: true } }
          }
        }
      }
    });

    for (const cert of lateReturns) {
      const entryTime = new Date(cert.entryScannedAt);
      const cutoff = new Date(entryTime);
      cutoff.setHours(19, 0, 0, 0);

      if (entryTime > cutoff) {
        // Check no alert already sent for this certificate
        const alreadyAlerted = await prisma.notification.findFirst({
          where: {
            requestId: cert.requestId,
            type: 'OVERDUE_ALERT',
            payload: { path: ['lateReturn'], equals: true }
          }
        });

        if (!alreadyAlerted) {
          await notificationService.send({
            type: 'OVERDUE_ALERT',
            userId: cert.request.wardenId,
            requestId: cert.requestId,
            channel: 'IN_APP',
            payload: {
              lateReturn: true,
              message: `Student returned late at ${entryTime.toLocaleTimeString('en-IN')} (after 7:00 PM cutoff).`,
              approvalNumber: cert.request.approvalNumber
            }
          });
        }
      }
    }

    console.log('[CRON] Overdue check complete');
    return overdueOutings.length + overdueHomeGoings.length;
  } catch (err) {
    console.error('[CRON ERROR]', err);
    return 0;
  }
};
