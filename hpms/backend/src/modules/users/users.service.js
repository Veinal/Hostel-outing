import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES, ROLES } from '../../shared/constants/roles.js';

export class UsersService {
  static async getProfile(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        room: {
          include: { floor: { include: { block: true } } }
        }
      }
    });
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async updateProfile(userId, role, data) {
    if (role === ROLES.STUDENT) {
      // Students can update: phone, year, branch, roomId, photoUrl
      // Explicitly reject email and usn
      const allowedFields = ['phone', 'year', 'branch', 'roomId', 'photoUrl'];
      const updateData = {};
      for (const key of Object.keys(data)) {
        if (allowedFields.includes(key)) {
          updateData[key] = data[key];
        } else {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Field ${key} cannot be updated by student`, 400);
        }
      }

      const updated = await db.user.update({
        where: { id: userId },
        data: updateData,
        include: { room: { include: { floor: { include: { block: true } } } } }
      });
      const { passwordHash, ...safeUser } = updated;
      return safeUser;
    } else {
      // Other roles can update similarly, but let's allow more or restrict as needed. 
      // For now, same restriction logic or just basic. 
      // Prompt focus is on student.
      const allowedFields = ['phone', 'photoUrl'];
      const updateData = {};
      for (const key of Object.keys(data)) {
        if (allowedFields.includes(key)) {
          updateData[key] = data[key];
        }
      }
      const updated = await db.user.update({
        where: { id: userId },
        data: updateData
      });
      const { passwordHash, ...safeUser } = updated;
      return safeUser;
    }
  }

  static async getActiveWardens() {
    const wardens = await db.user.findMany({
      where: {
        role: { in: [ROLES.WARDEN, ROLES.CHIEF_WARDEN] },
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        wardenOf: true,
        role: true
      }
    });
    return wardens;
  }
}
