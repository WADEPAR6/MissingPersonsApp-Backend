/* eslint-disable prettier/prettier */
// auth.controller.ts
import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>, @Res() response: Response) {
    const token = await this.authService.signIn(signInDto.email, signInDto.password);
    response.setHeader('Authorization', `Bearer ${token.access_token}`);
    return response.status(200).send({ message: 'Login successful', token: token.access_token });
  }

  @Post('logout') // Método para deslogueo  
  async signOut(@Req() request: Request, @Res() response: Response) {
    response.removeHeader('Authorization');
    return response.status(200).send({ message: 'Logout successful' });
  }
}