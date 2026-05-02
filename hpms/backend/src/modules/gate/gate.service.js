import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';
import { NotificationService } from '../notifications/notifications.service.js';

export class GateService {
  static async scanQr(qrToken, deviceId, scannedById, ipAddress) {
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.JWT_SECRET || 'supersecretjwt');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(ERROR_CODES.GATE_QR_EXPIRED, 'QR Token expired', 400);
      }
      throw new AppError(ERROR_CODES.GATE_QR_INVALID, 'Invalid QR Token', 400);
    }

    const { certificateId } = decoded;

    const certificate = await db.approvalCertificate.findUnique({
      where: { id: certificateId },
      include: {
        request: {
          include: {
            student: { include: { room: { include: { floor: { include: { block: true } } } } } },
            warden: true
          }
        }
      }
    });

    if (!certificate) {
      throw new AppError(ERROR_CODES.GATE_QR_INVALID, 'Certificate not found', 400);
    }

    if (certificate.status === 'CANCELLED') {
      throw new AppError(ERROR_CODES.GATE_PERMISSION_CANCELLED, 'Permission cancelled', 400);
    }
    if (certificate.status === 'COMPLETED') {
      throw new AppError(ERROR_CODES.GATE_QR_ALREADY_COMPLETED, 'Already completed', 400);
    }
    if (certificate.status === 'EXPIRED') {
      throw new AppError(ERROR_CODES.GATE_QR_EXPIRED, 'Permission expired', 400);
    }

    let scanType;
    if (!certificate.exitScannedAt) {
      scanType = 'EXIT';
    } else if (certificate.exitScannedAt && !certificate.entryScannedAt) {
      scanType = 'ENTRY';
    } else {
      throw new AppError(ERROR_CODES.GATE_QR_ALREADY_COMPLETED, 'Already completed', 400);
    }

    const now = new Date();

    const [scanLog, updatedCertificate] = await db.$transaction([
      db.scanLog.create({
        data: {
          scanType,
          certificateId,
          scannedById,
          deviceId,
          ipAddress,
          scannedAt: now
        }
      }),
      db.approvalCertificate.update({
        where: { id: certificateId },
        data: {
          exitScannedAt: scanType === 'EXIT' ? now : undefined,
          entryScannedAt: scanType === 'ENTRY' ? now : undefined,
          status: scanType === 'EXIT' ? 'STEPPED_OUT' : 'COMPLETED'
        }
      })
    ]);

    if (scanType === 'ENTRY') {
      await NotificationService.send({
        type: 'REQUEST_COMPLETED',
        userId: certificate.request.studentId,
        requestId: certificate.requestId,
        channel: 'IN_APP',
        payload: { message: 'Entry logged successfully', recipient: 'student' }
      });
    }

    return {
      scanType,
      student: {
        fullName: certificate.request.student.fullName,
        usn: certificate.request.student.usn,
        photoUrl: certificate.request.student.photoUrl,
        room: certificate.request.student.room?.displayName,
        block: certificate.request.student.room?.floor?.block?.name
      },
      permission: {
        approvalNumber: certificate.request.approvalNumber,
        approvedAt: certificate.approvedAt,
        outDateTime: certificate.request.outDateTime,
        expectedReturnDateTime: certificate.request.expectedReturnDateTime,
        requestType: certificate.request.requestType,
        location: certificate.request.location,
        wardenName: certificate.request.warden.fullName
      },
      certificate: {
        status: updatedCertificate.status,
        exitScannedAt: updatedCertificate.exitScannedAt,
        entryScannedAt: updatedCertificate.entryScannedAt
      }
    };
  }
}
