/* eslint-disable prettier/prettier */
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('debería lanzar excepción si el usuario no existe', async () => {
    userService.findByEmail!.mockResolvedValue(null);
    await expect(authService.signIn('test@email.com', '123456'))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('debería lanzar excepción si la contraseña es incorrecta', async () => {
    userService.findByEmail!.mockResolvedValue({ email: 'test@email.com', password: 'hashedPassword' });
    (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);
    await expect(authService.signIn('test@email.com', 'wrongpass'))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('debería retornar un token si login es exitoso', async () => {
    const user = { id: 1, email: 'test@email.com', password: 'hashedPassword' };
    userService.findByEmail!.mockResolvedValue(user);
    (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync!.mockResolvedValue('mocked_token');

    const result = await authService.signIn(user.email, 'correctPassword');
    expect(result).toEqual({ access_token: 'mocked_token' });
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email });
  });

  it('prueba de rendimiento: signIn debe ejecutarse en menos de 200ms', async () => {
    const user = { id: 1, email: 'test@email.com', password: 'hashedPassword' };
    userService.findByEmail!.mockResolvedValue(user);
    (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync!.mockResolvedValue('mocked_token');

    const start = Date.now();
    await authService.signIn(user.email, 'anyPassword');
    const end = Date.now();

    const duration = end - start;
    expect(duration).toBeLessThan(200);
  });
});
