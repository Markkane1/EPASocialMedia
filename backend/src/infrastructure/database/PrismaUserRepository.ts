import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRoleType } from '../../domain/entities/User';
import { PrismaClientSingleton } from './PrismaClientSingleton';
import { UserRole } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  private inMemoryUsers: Map<string, User> = new Map();

  constructor() {
    // Seed default administrative and executive accounts
    const adminUser = new User({
      id: 'usr-admin-001',
      username: 'admin',
      // Admin@EPAPunjab2026!
      passwordHash: '1981c7a87e2efe7c56ba1667614c23b9:6efe404837639e5a4e41e5b5b15010eb404745725831775918843201fc35158612b6dd97f2515561c97ac96bb86c6350c9933c3c3ba054190db580912f2cee04',
      fullName: 'EPA System Administrator',
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    });

    const execUser = new User({
      id: 'usr-exec-002',
      username: 'executive',
      // Executive@EPAPunjab2026!
      passwordHash: '509a8e9ff6d66eaf5926db8be79361cb:a87495d68d2dc69bf1f4146ff82384ef6922022d7f20355c625dcb0a942ecefc1456ac863aab76d2e670baa6d2dc96fe21c3e0360f649277848f708f83b26692',
      fullName: 'EPA Executive Officer',
      role: 'EXECUTIVE',
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
            role: user.role as UserRole
          },
          create: {
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
            role: user.role as UserRole
          }
        });
      } catch (err) {
        console.error('[DATABASE] Error persisting user to PostgreSQL:', err);
      }
    }
  }

  public async listUsers(): Promise<User[]> {
    return Array.from(this.inMemoryUsers.values());
  }
}
