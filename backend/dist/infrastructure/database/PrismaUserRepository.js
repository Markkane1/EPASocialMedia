"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const User_1 = require("../../domain/entities/User");
const PrismaClientSingleton_1 = require("./PrismaClientSingleton");
const AuthService_1 = require("../auth/AuthService");
class PrismaUserRepository {
    inMemoryUsers = new Map();
    constructor() {
        const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@EPAPunjab2026!';
        const execPass = process.env.DEFAULT_EXECUTIVE_PASSWORD || 'Executive@EPAPunjab2026!';
        // Seed default administrative and executive accounts
        const adminUser = new User_1.User({
            id: 'usr-admin-001',
            username: 'admin',
            passwordHash: AuthService_1.AuthService.hashPassword(adminPass),
            fullName: 'EPA System Administrator',
            role: 'ADMIN',
            isActive: true,
            createdAt: new Date().toISOString()
        });
        const execUser = new User_1.User({
            id: 'usr-exec-002',
            username: 'executive',
            passwordHash: AuthService_1.AuthService.hashPassword(execPass),
            fullName: 'EPA Executive Officer',
            role: 'EXECUTIVE',
            isActive: true,
            createdAt: new Date().toISOString()
        });
        this.inMemoryUsers.set('admin', adminUser);
        this.inMemoryUsers.set('executive', execUser);
    }
    async findByUsername(username) {
        const cleanUser = username.trim().toLowerCase();
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                const record = await prisma.user.findUnique({ where: { username: cleanUser } });
                if (record) {
                    return new User_1.User({
                        id: record.id,
                        username: record.username,
                        passwordHash: record.passwordHash,
                        fullName: record.fullName,
                        role: record.role,
                        isActive: record.isActive !== undefined ? record.isActive : true,
                        createdAt: record.createdAt.toISOString()
                    });
                }
            }
            catch (err) {
                console.error('[DATABASE] Error reading user from PostgreSQL:', err);
            }
        }
        return this.inMemoryUsers.get(cleanUser) || null;
    }
    async findById(id) {
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                const record = await prisma.user.findUnique({ where: { id } });
                if (record) {
                    return new User_1.User({
                        id: record.id,
                        username: record.username,
                        passwordHash: record.passwordHash,
                        fullName: record.fullName,
                        role: record.role,
                        isActive: record.isActive !== undefined ? record.isActive : true,
                        createdAt: record.createdAt.toISOString()
                    });
                }
            }
            catch (err) {
                console.error('[DATABASE] Error finding user by id:', err);
            }
        }
        for (const user of this.inMemoryUsers.values()) {
            if (user.id === id)
                return user;
        }
        return null;
    }
    async saveUser(user) {
        this.inMemoryUsers.set(user.username, user);
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                await prisma.user.upsert({
                    where: { username: user.username },
                    update: {
                        passwordHash: user.passwordHash,
                        fullName: user.fullName,
                        role: user.role,
                        isActive: user.isActive
                    },
                    create: {
                        id: user.id,
                        username: user.username,
                        passwordHash: user.passwordHash,
                        fullName: user.fullName,
                        role: user.role,
                        isActive: user.isActive
                    }
                });
            }
            catch (err) {
                console.error('[DATABASE] Error persisting user to PostgreSQL:', err);
            }
        }
    }
    async listUsers() {
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                const records = await prisma.user.findMany({
                    orderBy: { createdAt: 'asc' }
                });
                if (records.length > 0) {
                    return records.map(r => new User_1.User({
                        id: r.id,
                        username: r.username,
                        passwordHash: r.passwordHash,
                        fullName: r.fullName,
                        role: r.role,
                        isActive: r.isActive !== undefined ? r.isActive : true,
                        createdAt: r.createdAt.toISOString()
                    }));
                }
            }
            catch (err) {
                console.error('[DATABASE] Error listing users from PostgreSQL:', err);
            }
        }
        return Array.from(this.inMemoryUsers.values());
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
