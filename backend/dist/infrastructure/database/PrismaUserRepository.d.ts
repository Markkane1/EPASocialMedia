import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
export declare class PrismaUserRepository implements IUserRepository {
    private inMemoryUsers;
    constructor();
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    saveUser(user: User): Promise<void>;
    listUsers(): Promise<User[]>;
}
