import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Injectable()
export class ProductImageService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  /**
   * Converts a product image to a fixed size (1200px width) by generating
   * a new Cloudinary URL with transformations and updating the database.
   *
   * @param productImageId The ID of the product image to convert.
   * @returns The updated product image data.
   */
  async convertImage(productImageId: number) {
    const targetWidth = 1200;

    // 1. Find the original product image
    const image = await this.prisma.productImage.findUnique({
      where: { id: productImageId },
    });

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${productImageId} not found.`,
      );
    }

    // 2. Generate the new transformed URL using Cloudinary
    // Keep aspect ratio: width fixed to 1200px, no forced height, no crop.
    const transformedUrl = this.cloudinary.getImageUrl(image.publicId, {
      width: targetWidth,
      crop: 'limit',
      quality: 90,
      fetch_format: 'auto',
    });

    // 3. Update the database with the new URL and proportional dimensions
    const proportionalHeight = image.naturalWidth && image.naturalHeight
      ? Math.round((image.naturalHeight * targetWidth) / image.naturalWidth)
      : null;

    const updatedImage = await this.prisma.productImage.update({
      where: { id: productImageId },
      data: {
        url: transformedUrl,
        naturalWidth: targetWidth,
        ...(proportionalHeight ? { naturalHeight: proportionalHeight } : {}),
      },
    });

    return updatedImage;
  }
} 