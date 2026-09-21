export type UserRoleType = 'ADMIN' | 'EXECUTIVE';
export interface UserProps {
    id?: string;
    username: string;
    passwordHash: string;
    fullName: string;
    role: UserRoleType;
    createdAt?: string;
}
export declare class User {
    readonly id?: string;
    readonly username: string;
    readonly passwordHash: string;
    readonly fullName: string;
    readonly role: UserRoleType;
    readonly createdAt: string;
    constructor(props: UserProps);
    isAdmin(): boolean;
    toJSON(): {
        id: string | undefined;
        username: string;
        fullName: string;
        role: UserRoleType;
        createdAt: string;
    };
}
