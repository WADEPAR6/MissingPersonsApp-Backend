/* eslint-disable prettier/prettier */
// src/user/user.service.ts

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, name, lastname, address, phone, birthdate } = createUserDto;

    // Validar campos requeridos
    const missingFields: string[] = [];

    if (!name) missingFields.push('name');
    if (!lastname) missingFields.push('lastname');
    if (!address) missingFields.push('address');
    if (!phone) missingFields.push('phone');
    if (!birthdate) missingFields.push('birthdate');
    if (!username) missingFields.push('username');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      throw new BadRequestException({ message: `Llene los campos: ${missingFields.join(', ')}` });
    }

    // Verificar si el nombre de usuario ya existe
    const existingUser  = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser ) {
      throw new ConflictException({ message: 'Usuario ya usado' });
    }

    // Verificar si el correo electrónico ya existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException({ message: 'El correo electrónico ya está en uso' });
    }

    // Validar la contraseña y encriptarla
    if (password.length < 6) {
      throw new BadRequestException({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      throw new BadRequestException({ message: 'La contraseña debe contener al menos un carácter especial.' });
    }

    //Encriptar la contraseña
    const passwordHash = await bcrypt.hash(password, 10);


    // Convertir birthdate a objeto Date
    const birthdateDate = new Date(birthdate);
    if (isNaN(birthdateDate.getTime())) {
      throw new BadRequestException({ message: 'La fecha de nacimiento no es válida.' });
    }

    // Crear el nuevo usuario
    return this.prisma.user.create({
      data: {
        username,
        email,
        password : passwordHash,
        name,
        lastname,
        address,
        phone,
        birthdate: birthdateDate, // Usar el objeto Date
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const { name, lastname, address, phone, birthdate } = updateUserDto;

    // Validar campos requeridos si es necesario
    if (!name && !lastname && !address && !phone && !birthdate) {
      throw new BadRequestException({ message: 'Al menos un campo debe ser proporcionado para la actualización.' });
    }

    // Verificar si el usuario existe
    const existingUser  = await this.prisma.user.findUnique({
      where: { id : Number(id) },
    });

    if (!existingUser ) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    // Actualizar el usuario
    return this.prisma.user.update({
      where: { id : Number(id) },
      data: {
        ...(name && { name }),
        ...(lastname && { lastname }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(birthdate && { birthdate: new Date(birthdate) }), // Convertir a objeto Date si es necesario
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}