import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';

export class AuthService {
  static async login(email, password) {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        room: {
          include: { floor: { include: { block: true } } }
        }
      }
    });

    if (!user) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User is inactive', 404);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid credentials', 401);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user)
    };
  }

  static async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretrefresh');
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await db.user.findUnique({ where: { id: decoded.sub } });
      if (!user || !user.isActive) {
        throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'User invalid or inactive', 401);
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Refresh token expired', 401);
      }
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'Invalid refresh token', 401);
    }
  }

  static async forgotPassword(email) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return true; // Pretend success to avoid enum

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await db.passwordReset.create({
      data: { email, otpHash, expiresAt }
    });

    console.log(`[STUB EMAIL] To: ${email} | Subject: Password Reset OTP | Body: Your OTP is ${otp}`);
    return true;
  }

  static async resetPassword(email, otp, newPassword) {
    const resets = await db.passwordReset.findMany({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    if (resets.length === 0) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid or expired OTP', 400);

    const validReset = resets[0];
    const isValid = await bcrypt.compare(otp, validReset.otpHash);
    if (!isValid) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid OTP', 400);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { email }, data: { passwordHash } });

    await db.passwordReset.deleteMany({ where: { email } });
    return true;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Incorrect current password', 400);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: userId }, data: { passwordHash } });
    return true;
  }

  static async getUserProfile(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        room: {
          include: { floor: { include: { block: true } } }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found or inactive', 404);
    }

    return this.sanitizeUser(user);
  }

  static generateAccessToken(user) {
    return jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecretjwt',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'supersecretrefresh',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  static sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)([hdm])$/);
    if (!match) return 8 * 60 * 60 * 1000; // default 8h
    const val = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'h': return val * 60 * 60 * 1000;
      case 'd': return val * 24 * 60 * 60 * 1000;
      case 'm': return val * 60 * 1000;
      default: return val;
    }
  }
}
