import { User } from '../entities/User';
export interface IUserRepository {
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    saveUser(user: User): Promise<void>;
    listUsers(): Promise<User[]>;
}
