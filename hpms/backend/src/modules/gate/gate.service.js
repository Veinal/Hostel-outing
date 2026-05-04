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

    // Determine scan type from DB state — never trust client
    let scanType;
    let certificateUpdate;

    if (!certificate.exitScannedAt) {
      // First scan — EXIT
      scanType = 'EXIT';
      certificateUpdate = {
        exitScannedAt: new Date(),
        status: 'STEPPED_OUT'
      };
    } else if (!certificate.entryScannedAt) {
      // Second scan — ENTRY
      scanType = 'ENTRY';
      certificateUpdate = {
        entryScannedAt: new Date(),
        status: 'COMPLETED'
      };
    } else {
      // Both scans done
      throw new AppError(
        ERROR_CODES.GATE_QR_ALREADY_COMPLETED,
        'This permission has already been fully used',
        400
      );
    }

    // Run in transaction
    const [scanLog, updatedCertificate] = await db.$transaction([
      db.scanLog.create({
        data: {
          scanType,
          certificateId: certificate.id,
          scannedById,
          deviceId: deviceId || 'GATE_WEB',
          scannedAt: new Date(),
          ipAddress
        }
      }),
      db.approvalCertificate.update({
        where: { id: certificate.id },
        data: certificateUpdate
      }),
      ...(scanType === 'ENTRY' ? [
        db.outingRequest.update({
          where: { id: certificate.requestId },
          data: { status: 'COMPLETED' }
        })
      ] : [])
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

  static async getScans(user, query) {
    const { date, page = 1, limit = 50 } = query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [scans, total] = await db.$transaction([
      db.scanLog.findMany({
        where: {
          scannedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          certificate: {
            include: {
              request: {
                include: {
                  student: {
                    select: {
                      fullName: true,
                      usn: true,
                      photoUrl: true,
                      room: {
                        include: {
                          floor: { include: { block: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          scannedBy: {
            select: { fullName: true }
          }
        },
        orderBy: { scannedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      db.scanLog.count({
        where: {
          scannedAt: { gte: startOfDay, lte: endOfDay }
        }
      })
    ]);

    return { scans, total, page: parseInt(page), limit: parseInt(limit) };
  }
}
