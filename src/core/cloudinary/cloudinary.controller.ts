import { Controller, Post, UploadedFile, UseInterceptors, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/config-check')
  async checkConfig() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    return {
      cloudName: {
        exists: !!cloudName,
        value: cloudName || 'NOT SET',
        length: cloudName?.length || 0,
        hasQuotes: cloudName?.startsWith('"') || cloudName?.startsWith("'"),
      },
      apiKey: {
        exists: !!apiKey,
        value: apiKey ? apiKey.substring(0, 6) + '...' : 'NOT SET',
        length: apiKey?.length || 0,
        hasQuotes: apiKey?.startsWith('"') || apiKey?.startsWith("'"),
      },
      apiSecret: {
        exists: !!apiSecret,
        value: apiSecret ? '***' : 'NOT SET',
        length: apiSecret?.length || 0,
        hasQuotes: apiSecret?.startsWith('"') || apiSecret?.startsWith("'"),
      },
      cloudinaryConfig: {
        cloud_name: cloudinary.config().cloud_name || 'NOT CONFIGURED',
        api_key: cloudinary.config().api_key ? cloudinary.config().api_key.toString().substring(0, 6) + '...' : 'NOT CONFIGURED',
        api_secret: cloudinary.config().api_secret ? '***' : 'NOT CONFIGURED',
      }
    };
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEventImage(@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.cloudinaryService.uploadImage(file, 'event-image');
      return result;
    } catch (error) {
      throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
  }
}