import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { USER_ROLE, User } from '../user/user.model';
import { createSessionVersion } from './auth.utils';

describe('AuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() } as unknown as JwtService;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const userRepository = { findOne: jest.fn() } as unknown as typeof User;
  const guard = new AuthGuard(jwtService, reflector, userRepository);

  const createContext = (request: Record<string, unknown>) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext);

  beforeEach(() => jest.clearAllMocks());

  it('loads the current administrator from an HttpOnly session token', async () => {
    const password = '$2b$12$hash';
    const request = { headers: { cookie: 'admin_session=signed-token' } };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 1,
      role: USER_ROLE.ADMIN,
      sessionVersion: createSessionVersion(password),
    });
    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'admin',
      role: USER_ROLE.ADMIN,
      password,
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty(
      'user',
      expect.objectContaining({ id: 1, role: USER_ROLE.ADMIN }),
    );
    expect((request as any).user).not.toHaveProperty('password');
  });

  it('rejects a token issued before the password changed', async () => {
    const request = { headers: { cookie: 'admin_session=old-token' } };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 1,
      role: USER_ROLE.ADMIN,
      sessionVersion: createSessionVersion('old-hash'),
    });
    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      role: USER_ROLE.ADMIN,
      password: 'new-hash',
    });

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});
