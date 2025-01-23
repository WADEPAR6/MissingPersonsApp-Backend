/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    image?: string; // Imagen en base64

    @IsString()
    @IsNotEmpty()
    status?: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    userId: number;
}
