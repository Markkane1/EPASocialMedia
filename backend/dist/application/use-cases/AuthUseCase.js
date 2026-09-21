"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const AuthService_1 = require("../../infrastructure/auth/AuthService");
class AuthUseCase {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async login(username, password) {
        if (!username || !password) {
            return {
                success: false,
                message: 'Username and password are required.'
            };
        }
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password.'
            };
        }
        const isValid = AuthService_1.AuthService.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return {
                success: false,
                message: 'Invalid username or password.'
            };
        }
        const token = AuthService_1.AuthService.createToken({
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        });
        return {
            success: true,
            message: 'Authentication successful.',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        };
    }
    async verifyToken(token) {
        if (!token)
            return null;
        return AuthService_1.AuthService.verifyToken(token);
    }
}
exports.AuthUseCase = AuthUseCase;
//# sourceMappingURL=AuthUseCase.js.map