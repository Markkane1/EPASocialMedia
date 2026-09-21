"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    username;
    passwordHash;
    fullName;
    role;
    createdAt;
    constructor(props) {
        this.id = props.id;
        this.username = props.username.trim().toLowerCase();
        this.passwordHash = props.passwordHash;
        this.fullName = props.fullName;
        this.role = props.role;
        this.createdAt = props.createdAt || new Date().toISOString();
    }
    isAdmin() {
        return this.role === 'ADMIN';
    }
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            fullName: this.fullName,
            role: this.role,
            createdAt: this.createdAt
        };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map