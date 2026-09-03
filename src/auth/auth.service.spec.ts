import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { USER_ROLE, User } from '../user/user.model';

jest.mock('bcrypt');

describe('AuthService', () => {
  const jwtService = { signAsync: jest.fn() } as unknown as JwtService;
  const userRepository = { findOne: jest.fn() } as unknown as typeof User;
  const service = new AuthService(jwtService, userRepository);
  const admin = {
    id: 1,
    name: 'admin',
    role: USER_ROLE.ADMIN,
    password: '$2b$12$hash',
    email: 'admin@example.com',
    save: jest.fn(),
  } as unknown as User;

  beforeEach(() => jest.clearAllMocks());

  it('returns a safe profile and stores the JWT outside the response user', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(admin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('signed-token');

    const result = await service.login('admin', 'correct-password');

    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual(
      expect.objectContaining({ id: 1, name: 'admin', role: USER_ROLE.ADMIN }),
    );
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects a non-admin even when a password is supplied', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.login('user', 'password')).rejects.toMatchObject({
      status: 401,
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('changes only the authenticated administrator password', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(admin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new-hash');

    await service.changePassword(1, 'old-password', 'New-password1!');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, role: USER_ROLE.ADMIN },
    });
    expect(admin.password).toBe('$2b$12$new-hash');
    expect(admin.save).toHaveBeenCalled();
  });
});
