// sizes/size.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSizeDto } from './dto/create-size.dto';
import { PrismaService } from '../prisma.service';

// Enum pour les tailles standard (à synchroniser avec le schéma Prisma)
enum SizeType {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  XXXL = 'XXXL'
}

@Injectable()
export class SizeService {
  constructor(private prisma: PrismaService) {}

  // Temporary stub methods to prevent controller errors
  async create(createSizeDto: CreateSizeDto) {
    throw new BadRequestException('Size service is temporarily disabled. Sizes are now managed as strings in OrderItems.');
  }

  async findAll() {
    throw new BadRequestException('Size service is temporarily disabled. Sizes are now managed as strings in OrderItems.');
  }

  async findOne(id: number) {
    throw new BadRequestException('Size service is temporarily disabled. Sizes are now managed as strings in OrderItems.');
  }

  async remove(id: number) {
    throw new BadRequestException('Size service is temporarily disabled. Sizes are now managed as strings in OrderItems.');
  }

  /*
  // The Size model has been replaced by size fields in OrderItem in the new schema
  // This service is temporarily disabled

  async create(createSizeDto: CreateSizeDto) {
    try {
      console.log('Creating size with data:', createSizeDto);
      
      return await this.prisma.size.create({
        data: {
          name: createSizeDto.name,
          code: createSizeDto.code,
          description: createSizeDto.description,
          order: createSizeDto.order || 0,
        },
      });
    } catch (error) {
      console.error('Error creating size:', error);
      if (error.code === 'P2002') {
        throw new BadRequestException('A size with this name or code already exists');
      }
      throw new BadRequestException(`Error creating size: ${error.message}`);
    }
  }

  async findAll() {
    console.log('Finding all sizes...');
    const sizes = await this.prisma.size.findMany();
    console.log('Found sizes:', sizes.length);
    
    return sizes.map(size => ({
      id: size.id,
      name: size.name,
      code: size.code,
      description: size.description,
      order: size.order,
      createdAt: size.createdAt,
      updatedAt: size.updatedAt
    }));
  }

  async findOne(id: number) {
    console.log(`Finding size with id: ${id}`);
    const size = await this.prisma.size.findUnique({
      where: { id },
    });

    if (!size) {
      throw new NotFoundException(`Size with ID ${id} not found`);
    }

    return size;
  }

  async update(id: number, updateSizeDto: UpdateSizeDto) {
    try {
      return await this.prisma.size.update({
        where: { id },
        data: {
          name: updateSizeDto.name,
          code: updateSizeDto.code,
          description: updateSizeDto.description,
          order: updateSizeDto.order,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Size with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('A size with this name or code already exists');
      }
      throw new BadRequestException(`Error updating size: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.size.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Size with ID ${id} not found`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete this size as it is used by products');
      }
      throw new BadRequestException(`Error deleting size: ${error.message}`);
    }
  }
  */
}