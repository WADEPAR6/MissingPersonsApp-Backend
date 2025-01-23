/* eslint-disable prettier/prettier */
// src/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['Authorization']?.split(' ')[1]; // Extraer el token del encabezado

    if (!token) {
      return false; // No se proporcionó token
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      request.user = decoded; // Adjuntar información del usuario a la solicitud
      return true;
    } catch (error) {
      return false;
    }
  }
}