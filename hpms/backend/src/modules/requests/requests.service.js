import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES, ROLES } from '../../shared/constants/roles.js';
import { NotificationService } from '../notifications/notifications.service.js';
import { CertificatesService } from '../certificates/certificates.service.js';

export class RequestsService {
  static async generateApprovalNumber() {
    const year = new Date().getFullYear();
    const count = await db.outingRequest.count({
      where: {
        approvalNumber: {
          startsWith: `HO-${year}-`
        }
      }
    });
    const seq = String(count + 1).padStart(4, '0');
    return `HO-${year}-${seq}`;
  }

  static async createRequest(studentId, data) {
    const { requestType, location, reason, wardenId, outDateTime, expectedReturnDateTime } = data;

    const outDate = new Date(outDateTime);
    const returnDate = new Date(expectedReturnDateTime);
    const now = new Date();

    // 1. Buffer time check: 2h for OUTING, 4h for others
    const diffHours = (outDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (requestType === 'OUTING') {
      if (diffHours < 1.9) { // Using 1.9 to account for slight delays in submission
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Outing requests must be submitted at least 2 hours before departure', 400);
      }
    } else {
      if (diffHours < 3.9) { // Using 3.9 to account for slight delays in submission
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Departure time must be at least 4 hours from now', 400);
      }
    }

    // 2. Weekend OUTING rule (return by 19:00)
    const dayOfWeek = outDate.getDay();
    if (requestType === 'OUTING' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      if (returnDate.getHours() > 19 || (returnDate.getHours() === 19 && returnDate.getMinutes() > 0)) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Weekend outings must return by 19:00', 400);
      }
    }

    // 3. Warden check
    const warden = await db.user.findFirst({
      where: { id: wardenId, role: { in: [ROLES.WARDEN, ROLES.CHIEF_WARDEN] }, isActive: true }
    });
    if (!warden) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Selected warden is invalid or inactive', 400);
    }

    // 4. Overlapping active requests
    const overlapping = await db.outingRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { outDateTime: { lte: returnDate }, expectedReturnDateTime: { gte: outDate } }
        ]
      }
    });
    if (overlapping) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'You have an overlapping active request', 400);
    }

    const approvalNumber = await this.generateApprovalNumber();

    const request = await db.outingRequest.create({
      data: {
        approvalNumber,
        requestType,
        location,
        reason,
        outDateTime: outDate,
        expectedReturnDateTime: returnDate,
        studentId,
        wardenId
      }
    });

    await NotificationService.send({
      type: 'REQUEST_SUBMITTED',
      userId: studentId,
      requestId: request.id,
      channel: 'IN_APP',
      payload: { message: `Request ${approvalNumber} submitted successfully`, recipient: 'student' }
    });

    return request;
  }

  static async getRequests(user, query) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = {};
    if (user.role === ROLES.STUDENT) {
      where.studentId = user.sub;
    } else if ([ROLES.WARDEN, ROLES.CHIEF_WARDEN].includes(user.role)) {
      where.wardenId = user.sub;
    }

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      db.outingRequest.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { fullName: true, photoUrl: true, usn: true, room: { select: { displayName: true } } }
          },
          certificate: {
            select: { id: true, status: true }
          }
        }
      }),
      db.outingRequest.count({ where })
    ]);

    return { requests, total, page: Number(page), limit: Number(limit) };
  }

  static async getRequestById(id, user) {
    const request = await db.outingRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: { room: { include: { floor: { include: { block: true } } } } }
        },
        warden: {
          select: { id: true, fullName: true, phone: true, email: true }
        },
        certificate: {
          select: { id: true, status: true }
        }
      }
    });

    if (!request) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Request not found', 404);
    }

    if (user.role === ROLES.STUDENT && request.studentId !== user.sub) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'Unauthorized', 403);
    }
    if ([ROLES.WARDEN, ROLES.CHIEF_WARDEN].includes(user.role) && request.wardenId !== user.sub) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'Unauthorized', 403);
    }

    const { passwordHash, ...safeStudent } = request.student;
    
    // Parent phone visibility logic
    if (request.requestType !== 'HOME_GOING' || user.role === ROLES.STUDENT) {
      delete safeStudent.parentPhone;
    }

    return { ...request, student: safeStudent };
  }

  static async approve(id, wardenId) {
    const request = await db.outingRequest.findFirst({
      where: { id, wardenId, status: 'PENDING' }
    });

    if (!request) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Request not found or not in PENDING status', 404);
    }

    const updatedRequest = await db.outingRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    const certificate = await CertificatesService.create(id);

    await NotificationService.send({
      type: 'REQUEST_APPROVED',
      userId: request.studentId,
      requestId: request.id,
      channel: 'IN_APP',
      payload: { message: `Your request ${request.approvalNumber} has been approved`, recipient: 'student' }
    });

    if (request.requestType === 'HOME_GOING') {
      const student = await db.user.findUnique({ where: { id: request.studentId } });
      if (student && student.parentPhone) {
        await NotificationService.send({
          type: 'REQUEST_APPROVED',
          userId: student.id,
          requestId: request.id,
          channel: 'SMS',
          payload: { message: `Your ward ${student.fullName} has been approved for home going`, recipient: student.parentPhone }
        });
      }
    }

    return { request: updatedRequest, certificate };
  }

  static async reject(id, wardenId, reason) {
    const request = await db.outingRequest.findFirst({
      where: { id, wardenId, status: 'PENDING' }
    });

    if (!request) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Request not found or not in PENDING status', 404);
    }

    const updated = await db.outingRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason }
    });

    await NotificationService.send({
      type: 'REQUEST_REJECTED',
      userId: request.studentId,
      requestId: request.id,
      channel: 'IN_APP',
      payload: { message: `Request rejected: ${reason}`, recipient: 'student' }
    });

    return updated;
  }

  static async cancel(id, wardenId, reason) {
    const request = await db.outingRequest.findFirst({
      where: { id, wardenId, status: 'APPROVED' }
    });

    if (!request) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Request not found or not in APPROVED status', 404);
    }

    const updated = await db.outingRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await db.approvalCertificate.update({
      where: { requestId: id },
      data: { status: 'CANCELLED' }
    });

    await NotificationService.send({
      type: 'REQUEST_CANCELLED',
      userId: request.studentId,
      requestId: request.id,
      channel: 'IN_APP',
      payload: { message: `Your request ${request.approvalNumber} has been cancelled: ${reason}`, recipient: 'student' }
    });

    return updated;
  }

  static async delay(id, studentId, newExpectedReturnDateTime) {
    const request = await db.outingRequest.findFirst({
      where: { id, studentId, status: 'APPROVED' },
      include: { certificate: true }
    });

    if (!request || !request.certificate || request.certificate.status !== 'STEPPED_OUT') {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Request must be APPROVED and you must have stepped out', 400);
    }

    const updated = await db.outingRequest.update({
      where: { id },
      data: { expectedReturnDateTime: new Date(newExpectedReturnDateTime), delayFlagged: true }
    });

    await NotificationService.send({
      type: 'DELAY_FLAGGED',
      userId: request.wardenId,
      requestId: request.id,
      channel: 'IN_APP',
      payload: { message: `Student delayed return for request ${request.approvalNumber}`, recipient: 'warden' }
    });

    return updated;
  }
}
