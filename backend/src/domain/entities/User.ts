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

export class User {
  public readonly id?: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly fullName: string;
  public readonly role: UserRoleType;
  public readonly isActive: boolean;
  public readonly createdAt: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username.trim().toLowerCase();
    this.passwordHash = props.passwordHash;
    this.fullName = props.fullName;
    this.role = props.role;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdAt = props.createdAt || new Date().toISOString();
  }

  public isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  public withPasswordHash(newHash: string): User {
    return new User({
      id: this.id,
      username: this.username,
      passwordHash: newHash,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt
    });
  }

  public withActiveStatus(isActive: boolean): User {
    return new User({
      id: this.id,
      username: this.username,
      passwordHash: this.passwordHash,
      fullName: this.fullName,
      role: this.role,
      isActive,
      createdAt: this.createdAt
    });
  }

  public toJSON() {
    return {
      id: this.id,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }
}
