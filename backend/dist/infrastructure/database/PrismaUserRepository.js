"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const User_1 = require("../../domain/entities/User");
const PrismaClientSingleton_1 = require("./PrismaClientSingleton");
class PrismaUserRepository {
    inMemoryUsers = new Map();
    constructor() {
        // Seed default administrative and executive accounts
        const adminUser = new User_1.User({
            id: 'usr-admin-001',
            username: 'admin',
            passwordHash: '1981c7a87e2efe7c56ba1667614c23b9:6efe404837639e5a4e41e5b5b15010eb404745725831775918843201fc35158612b6dd97f2515561c97ac96bb86c6350c9933c3c3ba054190db580912f2cee04',
            fullName: 'EPA System Administrator',
            role: 'ADMIN',
            isActive: true,
            createdAt: new Date().toISOString()
        });
        const execUser = new User_1.User({
            id: 'usr-exec-002',
            username: 'executive',
            passwordHash: '509a8e9ff6d66eaf5926db8be79361cb:a87495d68d2dc69bf1f4146ff82384ef6922022d7f20355c625dcb0a942ecefc1456ac863aab76d2e670baa6d2dc96fe21c3e0360f649277848f708f83b26692',
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
                        role: user.role
                    },
                    create: {
                        id: user.id,
                        username: user.username,
                        passwordHash: user.passwordHash,
                        fullName: user.fullName,
                        role: user.role
                    }
                });
            }
            catch (err) {
                console.error('[DATABASE] Error persisting user to PostgreSQL:', err);
            }
        }
    }
    async listUsers() {
        return Array.from(this.inMemoryUsers.values());
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
//# sourceMappingURL=PrismaUserRepository.js.map