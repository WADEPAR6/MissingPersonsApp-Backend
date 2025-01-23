/* eslint-disable prettier/prettier */
// src/auth/token.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    const token = req.body.access_token; // Suponiendo que el token se envía en el cuerpo
    console.log(token);
    if (token) {
      req.headers['Authorization'] = `Bearer ${token}`;
    }
    next();
  }
}