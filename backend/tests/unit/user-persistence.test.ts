import { User } from '../../src/domain/entities/User';
import { PrismaUserRepository } from '../../src/infrastructure/database/PrismaUserRepository';
import { AuthService } from '../../src/infrastructure/auth/AuthService';

describe('User Entity & Repository isActive Persistence (H-07, H-08, H-09)', () => {
  let userRepo: PrismaUserRepository;

  beforeEach(() => {
    userRepo = new PrismaUserRepository();
  });

  test('User entity defaults isActive to true if omitted', () => {
    const user = new User({
      username: 'testuser',
      passwordHash: AuthService.hashPassword('Password123!'),
      fullName: 'Test User',
      role: 'EXECUTIVE'
    });
    expect(user.isActive).toBe(true);
  });

  test('User entity correctly stores isActive: false', () => {
    const user = new User({
      username: 'disabled_user',
      passwordHash: AuthService.hashPassword('Password123!'),
      fullName: 'Disabled User',
      role: 'EXECUTIVE',
      isActive: false
    });
    expect(user.isActive).toBe(false);
  });

  test('withActiveStatus returns new user instance with updated isActive status', () => {
    const activeUser = new User({
      username: 'toggle_user',
      passwordHash: AuthService.hashPassword('Password123!'),
      fullName: 'Toggle User',
      role: 'EXECUTIVE',
      isActive: true
    });

    const disabledUser = activeUser.withActiveStatus(false);
    expect(disabledUser.isActive).toBe(false);
    expect(disabledUser.username).toBe('toggle_user');

    const reEnabledUser = disabledUser.withActiveStatus(true);
    expect(reEnabledUser.isActive).toBe(true);
  });

  test('PrismaUserRepository stores and updates user isActive status', async () => {
    const user = new User({
      username: 'officer_1',
      passwordHash: AuthService.hashPassword('Password123!'),
      fullName: 'Officer One',
      role: 'EXECUTIVE',
      isActive: true
    });

    await userRepo.saveUser(user);
    const found = await userRepo.findByUsername('officer_1');
    expect(found).not.toBeNull();
    expect(found?.isActive).toBe(true);

    // Disable the user
    const disabled = found!.withActiveStatus(false);
    await userRepo.saveUser(disabled);

    const reFound = await userRepo.findByUsername('officer_1');
    expect(reFound?.isActive).toBe(false);
  });

  test('listUsers returns all users with their respective active status', async () => {
    const users = await userRepo.listUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);

    const admin = users.find(u => u.username === 'admin');
    expect(admin).toBeDefined();
    expect(admin?.isActive).toBe(true);
  });
});
