import bcrypt from 'bcrypt';
import { parse } from 'csv-parse';
import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES, ROLES } from '../../shared/constants/roles.js';
import { NotificationService } from '../notifications/notifications.service.js';

export class AdminService {
  // --- WARDENS ---
  static async getWardens() {
    return db.user.findMany({
      where: { role: { in: [ROLES.WARDEN, ROLES.CHIEF_WARDEN] } },
      include: {
        wardenOf: true
      }
    });
  }

  static async createWarden(data) {
    const { email, fullName, phone, password, blockId } = data;
    
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email already exists', 400);

    const passwordHash = await bcrypt.hash(password, 10);
    
    return db.user.create({
      data: {
        email,
        fullName,
        phone,
        passwordHash,
        role: ROLES.WARDEN,
        isActive: true,
        wardenOf: blockId ? { connect: { id: blockId } } : undefined
      }
    });
  }

  static async updateWarden(id, data) {
    return db.user.update({
      where: { id },
      data
    });
  }

  static async deleteWarden(id) {
    return db.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  static async assignWarden(id, blockId) {
    return db.user.update({
      where: { id },
      data: { wardenOf: blockId ? { connect: { id: blockId } } : { disconnect: true } }
    });
  }

  // --- STUDENTS ---
  static async getStudents(query) {
    const { page = 1, limit = 20, block, branch, year, search } = query;
    const skip = (page - 1) * limit;

    const where = { role: ROLES.STUDENT };
    if (block) where.room = { floor: { block: { name: block } } };
    if (branch) where.branch = branch;
    if (year) where.year = parseInt(year);
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { usn: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [students, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: { room: { include: { floor: { include: { block: true } } } } }
      }),
      db.user.count({ where })
    ]);

    return { students: students.map(({ passwordHash, ...rest }) => rest), total, page: Number(page), limit: Number(limit) };
  }

  static async getStudentById(id) {
    const student = await db.user.findUnique({
      where: { id, role: ROLES.STUDENT },
      include: { room: { include: { floor: { include: { block: true } } } } }
    });
    if (!student) throw new AppError(ERROR_CODES.NOT_FOUND, 'Student not found', 404);
    const { passwordHash, ...safe } = student;
    return safe;
  }

  static async updateStudent(id, data) {
    const updated = await db.user.update({
      where: { id, role: ROLES.STUDENT },
      data
    });
    const { passwordHash, ...safe } = updated;
    return safe;
  }

  static async resetStudentPassword(id) {
    // Stub for reset link. Send email logic.
    const student = await db.user.findUnique({ where: { id } });
    if (!student) throw new AppError(ERROR_CODES.NOT_FOUND, 'Student not found', 404);
    // Real implementation would generate a token and send email
    return { message: 'Reset link sent to ' + student.email };
  }

  // --- BULK IMPORT ---
  static async importStudents(fileBuffer) {
    return new Promise((resolve, reject) => {
      parse(fileBuffer, { columns: true, skip_empty_lines: true }, async (err, records) => {
        if (err) return reject(new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid CSV format', 400));
        
        let imported = 0;
        let failed = 0;
        const errors = [];

        for (let i = 0; i < records.length; i++) {
          const rowNum = i + 2; // +1 for 0-index, +1 for header
          const row = records[i];
          try {
            // Basic validation
            if (!row.email || !row.usn || !row.fullName) {
              throw new Error('Missing required fields (email, usn, fullName)');
            }

            // Check duplicate USN or Email
            const existing = await db.user.findFirst({
              where: { OR: [{ email: row.email }, { usn: row.usn }] }
            });
            if (existing) {
              throw new Error(`Email (${row.email}) or USN (${row.usn}) already exists`);
            }

            // Room assignment
            let roomId = null;
            if (row.block && row.roomNumber) {
              // Find block
              let block = await db.block.findUnique({ where: { name: row.block } });
              if (!block) {
                block = await db.block.create({ data: { name: row.block, gender: row.gender || 'MALE' } });
              }

              // Floor (assuming floor 1 for now if no specific logic)
              const floorNum = parseInt(row.roomNumber.toString().substring(0, 1)) || 1;
              let floor = await db.floor.findFirst({ where: { blockId: block.id, number: floorNum } });
              if (!floor) {
                floor = await db.floor.create({ data: { number: floorNum, blockId: block.id } });
              }

              let room = await db.room.findFirst({ where: { floorId: floor.id, roomNumber: row.roomNumber } });
              if (!room) {
                room = await db.room.create({ data: { roomNumber: row.roomNumber, displayName: `${block.name}-${row.roomNumber}`, floorId: floor.id } });
              }
              roomId = room.id;
            }

            const rawPassword = row.usn.substring(0, 4) + '@Hpms1';
            const passwordHash = await bcrypt.hash(rawPassword, 10);

            await db.user.create({
              data: {
                email: row.email,
                usn: row.usn,
                fullName: row.fullName,
                phone: row.phone,
                parentPhone: row.parentPhone,
                branch: row.branch,
                year: row.year ? parseInt(row.year) : undefined,
                gender: row.gender,
                roomId,
                passwordHash,
                role: ROLES.STUDENT,
                isActive: true
              }
            });

            imported++;
          } catch (rowErr) {
            failed++;
            errors.push({ row: rowNum, reason: rowErr.message });
          }
        }

        resolve({ imported, failed, errors });
      });
    });
  }

  // --- REPORTS ---
  static async getRequestsReport(query) {
    const { from, to, status, block, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where = {};
    if (from && to) {
      where.createdAt = { gte: new Date(from), lte: new Date(to) };
    }
    if (status) where.status = status;
    if (block) {
      where.student = { room: { floor: { block: { name: block } } } };
    }

    const [requests, total] = await Promise.all([
      db.outingRequest.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          student: { include: { room: { include: { floor: { include: { block: true } } } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.outingRequest.count({ where })
    ]);

    return { requests, total, page: Number(page), limit: Number(limit) };
  }

  static async getOverdueReport() {
    return db.outingRequest.findMany({
      where: { status: 'OVERDUE' },
      include: {
        student: { include: { room: { include: { floor: { include: { block: true } } } } } },
        warden: true
      }
    });
  }

  static async getSummary() {
    const totalStudents = await db.user.count({ where: { role: ROLES.STUDENT, isActive: true } });
    const totalWardens = await db.user.count({ where: { role: { in: [ROLES.WARDEN, ROLES.CHIEF_WARDEN] } } });
    
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Active OUTING requests (today only, before midnight)
    const activeOutings = await db.outingRequest.count({
      where: {
        status: 'APPROVED',
        requestType: 'OUTING',
        outDateTime: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    // Active HOME_GOING and OTHERS (not yet returned)
    const activeHomeGoings = await db.outingRequest.count({
      where: {
        status: 'APPROVED',
        requestType: { in: ['HOME_GOING', 'OTHERS'] },
        certificate: {
          entryScannedAt: null,
          status: { in: ['ACTIVE', 'STEPPED_OUT'] }
        }
      }
    });

    const activeRequests = activeOutings + activeHomeGoings;
    
    const approvedToday = await db.outingRequest.count({ 
      where: { 
        status: 'APPROVED',
        updatedAt: { gte: startOfToday }
      } 
    });
    
    const overdueNow = await db.outingRequest.count({ where: { status: 'OVERDUE' } });
    
    const steppedOutNow = await db.approvalCertificate.count({ where: { status: 'STEPPED_OUT' } });

    return {
      totalStudents,
      totalWardens,
      activeRequests,
      approvedToday,
      overdueNow,
      steppedOutNow
    };
  }
}
