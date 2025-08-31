import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProductImageService } from '../services/product-image.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-images')
@UseGuards(JwtAuthGuard)
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  /**
   * Converts a product image to a fixed 1200px width size.
   * POST /api/product-images/:id/convert
   */
  @Post(':id/convert')
  @HttpCode(HttpStatus.OK)
  async convertProductImage(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.productImageService.convertImage(id);
      return {
        success: true,
        message: 'Image converted successfully.',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
} 