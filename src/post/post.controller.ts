/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { Multer } from 'multer';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Multer.File,
    @Body() createPostDto: CreatePostDto,
  ) {
    if (file) {
      const base64Image = file.buffer.toString('base64');
      createPostDto.image = base64Image;
    }
    return this.postService.create(createPostDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const { posts, total } = await this.postService.findAll(pageNumber, limitNumber);

    return {
      data: posts,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return this.postService.findOne(+id);
  // }

  @Get('/24hours')
  async findAll24Hours() {
    return this.postService.findAll24Hours();
  }

  @Get('/status')
  async findAllLossStatus(@Body('status') status: string) {
    return this.postService.findAllStatus(status);
  }


  @Get('/username/:username') // Define the route to get posts by username
  async getPostsByUsername(@Param('username') username: string): Promise<any[]> {
    return this.postService.getPostsByUsername(username);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: number,
    @UploadedFile() file: Multer.File,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    if (file) {
      // Convertir archivo a base64
      const base64Image = file.buffer.toString('base64');
      updatePostDto.image = base64Image;
    }
    return this.postService.update(id, updatePostDto);
  }

  @Get('nearby')
  async getNearbyPosts(
    @Query('lat') latitude: string,
    @Query('lon') longitude: string,
    @Query('radius') radius: string,
  ) {
    const locationQuery = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radius ? parseFloat(radius) : undefined,
    };

    const posts = await this.postService.findAllByLocation(locationQuery);

    const postsWithCityInfo = await Promise.all(
      posts.map(async (post) => {
        const location = post.location as any;
        const cityInfo = await this.postService.getCityInfo({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        return {
          ...post,
          cityInfo,
        };
      }),
    );

    return postsWithCityInfo;
  }

  @Patch(':id/changeStatus')
  async changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.postService.changeStatus(+id, status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
