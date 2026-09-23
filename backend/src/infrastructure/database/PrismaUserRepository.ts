import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRoleType } from '../../domain/entities/User';
import { PrismaClientSingleton } from './PrismaClientSingleton';
import { UserRole } from '@prisma/client';
import { AuthService } from '../auth/AuthService';

export class PrismaUserRepository implements IUserRepository {
  private inMemoryUsers: Map<string, User> = new Map();

  constructor() {
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@EPAPunjab2026!';
    const execPass = process.env.DEFAULT_EXECUTIVE_PASSWORD || 'Executive@EPAPunjab2026!';

    // Seed default administrative and executive accounts
    const adminUser = new User({
      id: 'usr-admin-001',
      username: 'admin',
      passwordHash: AuthService.hashPassword(adminPass),
      fullName: 'EPA System Administrator',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    const execUser = new User({
      id: 'usr-exec-002',
      username: 'executive',
      passwordHash: AuthService.hashPassword(execPass),
      fullName: 'EPA Executive Officer',
      role: 'EXECUTIVE',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    this.inMemoryUsers.set('admin', adminUser);
    this.inMemoryUsers.set('executive', execUser);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const cleanUser = username.trim().toLowerCase();
    const isConnected = await PrismaClientSingleton.checkConnection();

    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        const record = await prisma.user.findUnique({ where: { username: cleanUser } });
        if (record) {
          return new User({
            id: record.id,
            username: record.username,
            passwordHash: record.passwordHash,
            fullName: record.fullName,
            role: record.role as UserRoleType,
            isActive: (record as any).isActive !== undefined ? (record as any).isActive : true,
            createdAt: record.createdAt.toISOString()
          });
        }
      } catch (err) {
        console.error('[DATABASE] Error reading user from PostgreSQL:', err);
      }
    }

    return this.inMemoryUsers.get(cleanUser) || null;
  }

  public async findById(id: string): Promise<User | null> {
    const isConnected = await PrismaClientSingleton.checkConnection();
    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        const record = await prisma.user.findUnique({ where: { id } });
        if (record) {
          return new User({
            id: record.id,
            username: record.username,
            passwordHash: record.passwordHash,
            fullName: record.fullName,
            role: record.role as UserRoleType,
            isActive: (record as any).isActive !== undefined ? (record as any).isActive : true,
            createdAt: record.createdAt.toISOString()
          });
        }
      } catch (err) {
        console.error('[DATABASE] Error finding user by id:', err);
      }
    }

    for (const user of this.inMemoryUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  public async saveUser(user: User): Promise<void> {
    this.inMemoryUsers.set(user.username, user);

    const isConnected = await PrismaClientSingleton.checkConnection();
    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        await prisma.user.upsert({
          where: { username: user.username },
          update: {
            passwordHash: user.passwordHash,
            fullName: user.fullName,
            role: user.role as UserRole,
            isActive: user.isActive
          } as any,
          create: {
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
            role: user.role as UserRole,
            isActive: user.isActive
          } as any
        });
      } catch (err) {
        console.error('[DATABASE] Error persisting user to PostgreSQL:', err);
      }
    }
  }

  public async listUsers(): Promise<User[]> {
    const isConnected = await PrismaClientSingleton.checkConnection();
    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        const records = await prisma.user.findMany({
          orderBy: { createdAt: 'asc' }
        });
        if (records.length > 0) {
          return records.map(r => new User({
            id: r.id,
            username: r.username,
            passwordHash: r.passwordHash,
            fullName: r.fullName,
            role: r.role as UserRoleType,
            isActive: (r as any).isActive !== undefined ? (r as any).isActive : true,
            createdAt: r.createdAt.toISOString()
          }));
        }
      } catch (err) {
        console.error('[DATABASE] Error listing users from PostgreSQL:', err);
      }
    }

    return Array.from(this.inMemoryUsers.values());
  }
}
