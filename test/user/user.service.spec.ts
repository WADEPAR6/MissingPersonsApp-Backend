/* eslint-disable prettier/prettier */

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('debería lanzar error si faltan campos requeridos', async () => {
      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar error si el usuario ya existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1 }); // para username
      await expect(
        service.create({
          username: 'test',
          email: 'test@test.com',
          password: 'Password!',
          name: 'John',
          lastname: 'Doe',
          address: '123 St',
          phone: '1234567890',
          birthdate: '1990-01-01',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debería crear usuario correctamente', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // username
        .mockResolvedValueOnce(null); // email

      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        username: 'test',
        email: 'test@test.com',
      });

      const result = await service.create({
        username: 'test',
        email: 'test@test.com',
        password: 'Password!',
        name: 'John',
        lastname: 'Doe',
        address: '123 St',
        phone: '1234567890',
        birthdate: '1990-01-01',
      });

      expect(result).toEqual({
        id: 1,
        username: 'test',
        email: 'test@test.com',
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('debería retornar todos los usuarios', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('findOne()', () => {
    it('debería retornar un usuario por ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update()', () => {
    it('debería lanzar error si no se pasa ningún campo', async () => {
      await expect(service.update('1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar error si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('1', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('debería actualizar el usuario', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.user.update.mockResolvedValue({ id: 1, name: 'New' });

      const result = await service.update('1', { name: 'New' });
      expect(result).toEqual({ id: 1, name: 'New' });
    });
  });

  describe('remove()', () => {
    it('debería eliminar un usuario', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });
      const result = await service.remove(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
