import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DelimitationService } from './delimitation.service';
import { DelimitationDto } from '../product/dto/create-product-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('delimitations')
@UseGuards(JwtAuthGuard)
export class DelimitationController {
  constructor(private readonly delimitationService: DelimitationService) {}

  /**
   * Créer une nouvelle délimitation
   * POST /api/delimitations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDelimitation(
    @Body() payload: { productImageId: number; delimitation: DelimitationDto }
  ) {
    try {
      const result = await this.delimitationService.createDelimitation(
        payload.productImageId,
        payload.delimitation
      );

      return {
        success: true,
        data: {
          ...result,
          coordinateType: result.coordinateType === 'ABSOLUTE' ? 'PIXEL' : result.coordinateType,
        },
        message: 'Délimitation créée avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }

  /**
   * Mettre à jour une délimitation
   * PUT /api/delimitations/:id
   */
  @Put(':id')
  async updateDelimitation(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) data: Partial<DelimitationDto>
  ) {
    try {
      const result = await this.delimitationService.updateDelimitation(id, data);

      return {
        success: true,
        data: {
          ...result,
          coordinateType: result.coordinateType === 'ABSOLUTE' ? 'PIXEL' : result.coordinateType,
        },
        message: 'Délimitation mise à jour avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Récupérer les délimitations d'une image
   * GET /api/delimitations/image/:imageId
   */
  @Get('image/:id')
  async getImageDelimitations(@Param('id', ParseIntPipe) imageId: number) {
    try {
      const payload = await this.delimitationService.getImageWithDelimitations(imageId);

      return {
        success: true,
        ...payload,
        count: payload.delimitations.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Supprimer une délimitation
   * DELETE /api/delimitations/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDelimitation(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.delimitationService.deleteDelimitation(id);

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Migrer une délimitation vers des coordonnées en pourcentages
   * POST /api/delimitations/:id/migrate
   */
  @Post(':id/migrate')
  async migrateToPercentage(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      imageWidth: number;
      imageHeight: number;
    },
  ) {
    try {
      const result = await this.delimitationService.migrateToPercentage(
        id,
        data.imageWidth,
        data.imageHeight,
      );

      return {
        success: true,
        data: result,
        message: 'Délimitation migrée vers les pourcentages avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || HttpStatus.BAD_REQUEST,
      };
    }
  }

  /**
   * Migrer toutes les délimitations d'un produit
   * POST /api/delimitations/migrate/product/:productId
   */
  @Post('migrate/product/:productId')
  async migrateProductDelimitations(@Param('productId', ParseIntPipe) productId: number) {
    try {
      const result = await this.delimitationService.migrateProductDelimitationsToPercentage(productId);

      return {
        success: true,
        data: result,
        message: `Migration terminée: ${result.success} succès, ${result.errors} erreurs sur ${result.total} délimitations`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Obtenir les statistiques des délimitations
   * GET /api/delimitations/stats
   */
  @Get('stats')
  async getDelimitationStats() {
    try {
      const stats = await this.delimitationService.getDelimitationStats();

      return {
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Utilitaire pour convertir coordonnées absolues → pourcentages
   * POST /api/delimitations/convert/to-percentage
   */
  @Post('convert/to-percentage')
  convertToPercentage(
    @Body()
    data: {
      x: number;
      y: number;
      width: number;
      height: number;
      imageWidth: number;
      imageHeight: number;
    },
  ) {
    try {
      const result = DelimitationService.convertAbsoluteToPercentage(
        {
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
        },
        {
          width: data.imageWidth,
          height: data.imageHeight,
        },
      );

      return {
        success: true,
        data: result,
        message: 'Conversion réussie',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }

  /**
   * Utilitaire pour convertir coordonnées pourcentages → absolues
   * POST /api/delimitations/convert/to-absolute
   */
  @Post('convert/to-absolute')
  convertToAbsolute(
    @Body()
    data: {
      x: number;
      y: number;
      width: number;
      height: number;
      imageWidth: number;
      imageHeight: number;
    },
  ) {
    try {
      const result = DelimitationService.convertPercentageToAbsolute(
        {
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
        },
        {
          width: data.imageWidth,
          height: data.imageHeight,
        },
      );

      return {
        success: true,
        data: result,
        message: 'Conversion réussie',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }
} 