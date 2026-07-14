import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const manager = await this.db.getOne<{ id: number; username: string; password: string }>(
      'SELECT id, username, password FROM manager WHERE username = ? AND active = 1',
      [username],
    );
    if (!manager) throw new UnauthorizedException('Invalid credentials');

    const isBcrypt = await bcrypt.compare(password, manager.password).catch(() => false);
    const isMd5 = crypto.createHash('md5').update(password).digest('hex') === manager.password;
    const isRaw = !isBcrypt && !isMd5 && password === manager.password;

    if (!isBcrypt && !isMd5 && !isRaw) throw new UnauthorizedException('Invalid credentials');

    if (isMd5 || isRaw) {
      const hashed = await bcrypt.hash(password, 10);
      await this.db.execute('UPDATE manager SET password = ? WHERE id = ?', [hashed, manager.id]);
    }

    const payload = { sub: manager.id, username: manager.username };
    const accessToken = this.jwtService.sign(payload);

    await this.db.execute('UPDATE manager SET last_active = NOW() WHERE id = ?', [manager.id]);

    return { accessToken, manager: { id: manager.id, username: manager.username } };
  }

  async getProfile(managerId: number) {
    return this.db.getOne('SELECT id, username, active, last_active, created_at FROM manager WHERE id = ?', [managerId]);
  }

  async createManager(username: string, password: string) {
    const existing = await this.db.getOne('SELECT id FROM manager WHERE username = ?', [username]);
    if (existing) throw new ConflictException('Username already exists');

    const hashed = await bcrypt.hash(password, 10);
    const result = await this.db.insert('manager', {
      username,
      password: hashed,
      active: 1,
      last_active: new Date(),
      created_at: new Date(),
    });

    return { id: result, username };
  }

  async updatePassword(managerId: number, currentPassword: string, newPassword: string) {
    const manager = await this.db.getOne<{ id: number; password: string }>('SELECT id, password FROM manager WHERE id = ?', [managerId]);
    if (!manager) throw new UnauthorizedException('Manager not found');

    const isValid = await bcrypt.compare(currentPassword, manager.password).catch(() => false);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.db.execute('UPDATE manager SET password = ? WHERE id = ?', [hashed, managerId]);

    return { success: true };
  }
}
