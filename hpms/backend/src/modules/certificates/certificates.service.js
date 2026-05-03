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

  static async getById(id, user) {
    const cert = await db.approvalCertificate.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            student: {
              include: {
                room: {
                  include: {
                    floor: {
                      include: { block: true }
                    }
                  }
                }
              }
            },
            warden: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!cert) throw new AppError(ERROR_CODES.NOT_FOUND, 'Certificate not found', 404);
    
    const isStudent = user.role === 'STUDENT' && cert.request.studentId === user.sub;
    const isAssignedWarden = (user.role === 'WARDEN' || user.role === 'CHIEF_WARDEN') && cert.request.wardenId === user.sub;
    const isAdminOrSecurity = ['ADMIN', 'CHIEF_WARDEN', 'SECURITY'].includes(user.role);

    if (!isStudent && !isAssignedWarden && !isAdminOrSecurity) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'You do not have access to this certificate', 403);
    }

    return cert;
  }

  static async getCertificateByRequestId(requestId, user) {
    const certificate = await db.approvalCertificate.findUnique({
      where: { requestId },
      include: { 
        request: { 
          include: { 
            student: { 
              include: { 
                room: { 
                  include: { 
                    floor: { include: { block: true } } 
                  } 
                } 
              } 
            }, 
            warden: { 
              select: { 
                id: true, fullName: true, phone: true, email: true 
              } 
            } 
          } 
        } 
      }
    });
    
    if (!certificate) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Certificate not found', 404);
    }
    
    const isStudent = user.role === 'STUDENT' && certificate.request.studentId === user.sub;
    const isAssignedWarden = (user.role === 'WARDEN' || user.role === 'CHIEF_WARDEN') && certificate.request.wardenId === user.sub;
    const isAdminOrSecurity = ['ADMIN', 'CHIEF_WARDEN', 'SECURITY'].includes(user.role);

    if (!isStudent && !isAssignedWarden && !isAdminOrSecurity) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'You do not have access to this certificate', 403);
    }
    
    return certificate;
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
