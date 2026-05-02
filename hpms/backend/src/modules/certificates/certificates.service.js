import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';

export class CertificatesService {
  static async create(requestId) {
    const request = await db.outingRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');

    const certificateId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

    const payload = {
      certificateId,
      requestId,
      approvalNumber: request.approvalNumber
    };

    const qrToken = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwt', { expiresIn: '48h' });

    const certificate = await db.approvalCertificate.create({
      data: {
        id: certificateId,
        qrToken,
        requestId
      }
    });

    return certificate;
  }

  static async getById(id) {
    const cert = await db.approvalCertificate.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            student: { include: { room: true } },
            warden: true
          }
        }
      }
    });

    if (!cert) throw new AppError(ERROR_CODES.NOT_FOUND, 'Certificate not found', 404);
    
    // We strip out full details but this returns everything needed
    return cert;
  }

  static async verify(qrToken) {
    try {
      const decoded = jwt.verify(qrToken, process.env.JWT_SECRET || 'supersecretjwt');
      const cert = await db.approvalCertificate.findUnique({
        where: { id: decoded.certificateId },
        include: { request: { include: { student: true } } }
      });
      if (!cert) throw new Error();
      return cert;
    } catch (err) {
      throw new AppError(ERROR_CODES.GATE_QR_INVALID, 'Invalid or expired QR token', 400);
    }
  }

  static async getByApprovalNumber(approvalNumber) {
    const request = await db.outingRequest.findUnique({
      where: { approvalNumber },
      include: { certificate: true }
    });
    if (!request || !request.certificate) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Certificate not found for this approval number', 404);
    }
    return request.certificate;
  }
}
