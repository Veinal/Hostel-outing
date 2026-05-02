import { db } from '../../config/db.js';
import { EmailService } from './channels/email.service.js';
import { SmsService } from './channels/sms.service.js';
import { Templates } from './templates/index.js';

export const NotificationService = {
  send: async ({ type, userId, requestId, channel, payload }) => {
    try {
      // 1. Fetch relevant users if we don't have enough payload data
      let student = null, warden = null, request = null;
      if (requestId) {
        request = await db.outingRequest.findUnique({ where: { id: requestId }, include: { student: true, warden: true } });
        if (request) {
          student = request.student;
          warden = request.warden;
        }
      } else if (userId) {
        student = await db.user.findUnique({ where: { id: userId } });
      }

      // 2. Determine recipients and templates based on type
      const tasks = [];

      // Log in_app implicitly by saving to DB (handled at the end)

      // EMAIL logic
      if (['REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED'].includes(type) && student?.email) {
        if (Templates[type]) {
          const tpl = Templates[type]({ ...payload, approvalNumber: request?.approvalNumber, requestType: request?.requestType });
          tasks.push({
            channel: 'EMAIL',
            recipient: student.email,
            execute: () => EmailService.send({ to: student.email, subject: tpl.subject, html: tpl.html })
          });
        }
      }

      // SMS logic for parent
      if (type === 'REQUEST_APPROVED' && request?.requestType === 'HOME_GOING' && student?.parentPhone) {
        const outDate = new Date(request.outDateTime).toLocaleDateString();
        const retTime = new Date(request.expectedReturnDateTime).toLocaleString();
        const msg = `${student.fullName} from HPMS has been granted permission for ${request.requestType} on ${outDate}. Return by ${retTime}. Warden: ${warden?.fullName} - ${warden?.phone || 'N/A'}`.substring(0, 160);
        tasks.push({
          channel: 'SMS',
          recipient: student.parentPhone,
          execute: () => SmsService.send({ to: student.parentPhone, message: msg })
        });
      }

      // SMS logic for warden (DELAY, OVERDUE)
      if (['DELAY_FLAGGED', 'OVERDUE_ALERT'].includes(type) && warden?.phone) {
        const msg = `HPMS Alert: Student ${student?.fullName} is ${type === 'DELAY_FLAGGED' ? 'delayed' : 'OVERDUE'} for request ${request?.approvalNumber}.`;
        tasks.push({
          channel: 'SMS',
          recipient: warden.phone,
          execute: () => SmsService.send({ to: warden.phone, message: msg.substring(0, 160) })
        });
      }

      // Execute all notifications
      for (const task of tasks) {
        try {
          await task.execute();
          // Write success to DB
          await db.notification.create({
            data: {
              type,
              userId,
              requestId,
              channel: task.channel,
              recipient: task.recipient,
              payload,
              sentAt: new Date()
            }
          });
        } catch (err) {
          // Write error to DB
          await db.notification.create({
            data: {
              type,
              userId,
              requestId,
              channel: task.channel,
              recipient: task.recipient,
              payload,
              error: err.message || 'Send failed'
            }
          });
        }
      }

      // Also create an IN_APP notification
      await db.notification.create({
        data: {
          type,
          userId,
          requestId,
          channel: 'IN_APP',
          recipient: 'system',
          payload,
          sentAt: new Date()
        }
      });

    } catch (err) {
      console.error('[NOTIFICATION ORCHESTRATOR ERROR]', err);
    }
  }
};
