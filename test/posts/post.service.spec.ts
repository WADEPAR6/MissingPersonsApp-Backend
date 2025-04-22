/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing'
import { PostService } from '../../src/post/post.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

const mockPrismaService = {
  post: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

describe('PostService', () => {
  let service: PostService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const dto = {
        title: 'Post de prueba',
        description: 'Descripción',
        image: 'base64',
        location: { latitude: 1, longitude: 2 },
        userId: 1,
      };

      const createdPost = { id: 1, ...dto, status: 'Perdid@' };

      (prisma.post.create as jest.Mock).mockResolvedValue(createdPost);

      const result = await service.create(dto as any);
      expect(result).toEqual(createdPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          image: dto.image,
          status: 'Perdid@',
          location: dto.location,
          user: {
            connect: { id: dto.userId },
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated posts and total', async () => {
      const posts = [{ id: 1 }, { id: 2 }];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(2);
      prisma.$transaction = jest.fn().mockResolvedValue([posts, 2]);

      const result = await service.findAll(1, 10);
      expect(result).toEqual({ posts, total: 2 });
    });
  });

  describe('findAllStatus', () => {
    it('should return posts with given status', async () => {
      const posts = [{ id: 1, status: 'Perdid@' }];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await service.findAllStatus('Perdid@');
      expect(result).toEqual(posts);
    });

    it('should throw NotFoundException if no posts found', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.findAllStatus('Perdid@')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a post if it exists', async () => {
      const post = { id: 1 };
      const updateDto = { title: 'Updated Title' };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(post);
      (prisma.post.update as jest.Mock).mockResolvedValue({ ...post, ...updateDto });

      const result = await service.update(1, updateDto as any);
      expect(result).toEqual({ ...post, ...updateDto });
    });

    it('should throw NotFoundException if post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll24Hours', () => {
    it('should return posts from last 24 hours', async () => {
      const posts = [{ id: 1, createdAt: new Date() }];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await service.findAll24Hours();
      expect(result).toEqual({ posts, total: posts.length });
    });

    it('should return empty if no recent posts', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll24Hours();
      expect(result).toEqual({ posts: [], total: 0 });
    });
  });

  describe('findAllByUser', () => {
    it('should return posts by user ID', async () => {
      const posts = [{ id: 1, userId: 1 }];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await service.findAllByUser(1);
      expect(result).toEqual(posts);
    });

    it('should throw NotFoundException if no posts found', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.findAllByUser(999)).rejects.toThrow(NotFoundException);
    });
  });
});
