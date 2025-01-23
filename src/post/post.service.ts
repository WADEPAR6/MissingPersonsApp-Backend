/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from '@prisma/client';

interface LocationQuery {
  latitude: number;
  longitude: number;
  radius?: number;
}

interface Location {
  latitude: number;
  longitude: number;
}

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        description: createPostDto.description,
        image: createPostDto.image,
        status: "Perdid@",
        location: createPostDto.location,
        user: {
          connect: { id: createPostDto.userId },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ posts: Post[]; total: number }> {
    const offset = (page - 1) * limit;

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
        },
      }),
      this.prisma.post.count(),
    ]);

    return { posts, total };
  }

  async findAllStatus(status: string): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: status,
      },
    });
    if (!posts.length) {
      throw new NotFoundException(`No posts found with status: Perdid@`)
    }
    return posts;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Método actualizado para buscar posts por ubicación
  async findAllByLocation(locationQuery: LocationQuery): Promise<Post[]> {
    const { latitude, longitude, radius = 5 } = locationQuery; // Radio predeterminado de 5km

    // Obtener todos los posts
    const allPosts = await this.prisma.post.findMany({
      include: {
        user: true,
      },
    });

    // Filtrar posts por distancia
    const nearbyPosts = allPosts.filter((post) => {
      try {
        const postLocation = post.location as unknown as Location;
        if (!postLocation?.latitude || !postLocation?.longitude) {
          return false;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          postLocation.latitude,
          postLocation.longitude,
        );

        return distance <= radius;
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        return false;
      }
    });

    if (!nearbyPosts.length) {
      throw new NotFoundException(
        `No posts found within ${radius}km of location: ${latitude}, ${longitude}`,
      );
    }

    // Ordenar posts por distancia
    const postsWithDistance = nearbyPosts.map(post => {
      const postLocation = post.location as unknown as Location;
      const distance = this.calculateDistance(
        latitude,
        longitude,
        postLocation.latitude,
        postLocation.longitude,
      );
      return { ...post, distance };
    }).sort((a, b) => a.distance - b.distance);

    return postsWithDistance;
  }

  // Nuevo método para obtener la información de la ciudad
  async getCityInfo(location: Location): Promise<any> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
      );
      const data = await response.json();
      return {
        city: data.address.city || data.address.town || data.address.village,
        state: data.address.state,
        country: data.address.country,
      };
    } catch (error) {
      console.error('Error getting city info:', error);
      return null;
    }
  }

  async findAllByUser(userId: number): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        userId: Number(userId),
      },
    });
    if (!posts.length) {
      throw new NotFoundException(`No posts found for user with ID: ${userId}`)
    }
    return posts;
  }

  // async findOne(id: number): Promise<Post> {
  //   const post = await this.prisma.post.findUnique({
  //     where: { id: Number(id) },
  //   });
  //   if (!post) {
  //     throw new NotFoundException(`Post with ID ${id} not found`);
  //   }
  //   return post;
  // }


  // Metodo para obtener todos los posts de las ultimas 24 horas
  async findAll24Hours(): Promise<{ posts: Post[]; total: number }> {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: true,
      },
    });
    if (!posts.length) {
      return { posts: [], total: 0 };
    }
    const total = posts.length;
    return { posts, total };
  }

  // Método para obtener todos los posts de un usuario
  async getPostsByUsername(username: string): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        user: {
          id: Number(username),
        },
      },
    });
    if (!posts.length) {
      throw new NotFoundException(`No posts found for user: ${username}`)
    }
    return posts;
  }

  // Método para actualizar un post
  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return this.prisma.post.update({
      where: { id: Number(id) },
      data: {
        title: updatePostDto.title,
        description: updatePostDto.description,
        image: updatePostDto.image,
        status: updatePostDto.status,
        location: updatePostDto.location,
      },
    });
  }

  // Metodo para cambiar el status de un post (Perdid@, Encontrad@, Muert@)
  async changeStatus(id: number, status: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return this.prisma.post.update({
      where: { id: Number(id) },
      data: {
        status,
      },
    });
  }

  async remove(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }
}
