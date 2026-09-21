export type UserRoleType = 'ADMIN' | 'EXECUTIVE';

export interface UserProps {
  id?: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRoleType;
  createdAt?: string;
}

export class User {
  public readonly id?: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly fullName: string;
  public readonly role: UserRoleType;
  public readonly createdAt: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username.trim().toLowerCase();
    this.passwordHash = props.passwordHash;
    this.fullName = props.fullName;
    this.role = props.role;
    this.createdAt = props.createdAt || new Date().toISOString();
  }

  public isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  public toJSON() {
    return {
      id: this.id,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}
