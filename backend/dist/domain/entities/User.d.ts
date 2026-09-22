export type UserRoleType = 'ADMIN' | 'EXECUTIVE';
export interface UserProps {
    id?: string;
    username: string;
    passwordHash: string;
    fullName: string;
    role: UserRoleType;
    isActive?: boolean;
    createdAt?: string;
}
export declare class User {
    readonly id?: string;
    readonly username: string;
    readonly passwordHash: string;
    readonly fullName: string;
    readonly role: UserRoleType;
    readonly isActive: boolean;
    readonly createdAt: string;
    constructor(props: UserProps);
    isAdmin(): boolean;
    withPasswordHash(newHash: string): User;
    withActiveStatus(isActive: boolean): User;
    toJSON(): {
        id: string | undefined;
        username: string;
        fullName: string;
        role: UserRoleType;
        isActive: boolean;
        createdAt: string;
    };
}
