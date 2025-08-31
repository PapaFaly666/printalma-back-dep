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
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    BadRequestException,
    Query,
    UseGuards
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { multerConfig } from 'multerConfig';
  import { ProductViewService } from './product-view.service';
import { ProductViewResponseDto } from './dto/product-view-response-dto';
import { CreateProductViewDto } from './dto/create-product-view-dto';
import { ViewType } from './dto/view-type';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

  

  @ApiBearerAuth()
  @ApiTags('Product Views')
  @Controller('product-views')
  export class ProductViewController {
    constructor(private readonly productViewService: ProductViewService) {}
  
    //@UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Ajouter une nouvelle vue à un produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          productId: { 
            type: 'integer',
            example: 1
          },
          viewType: { 
            type: 'string',
            enum: Object.values(ViewType),
            example: 'FRONT'
          },
          description: {
            type: 'string',
            example: 'Vue de face du T-shirt'
          },
          image: {
            type: 'string',
            format: 'binary'
          }
        },
        required: ['productId', 'viewType', 'image']
      }
    })
    @ApiResponse({ 
      status: 201, 
      description: 'Vue créée avec succès',
      type: ProductViewResponseDto
    })
    async create(
      @Body() createProductViewDto: CreateProductViewDto,
      @UploadedFile() file: Express.Multer.File
    ) {
      if (!file) {
        throw new BadRequestException('L\'image est obligatoire');
      }
      return this.productViewService.create(createProductViewDto, file);
    }
  
    //@UseGuards(JwtAuthGuard)
    @Get('product/:productId')
    @ApiOperation({ summary: 'Récupérer toutes les vues d\'un produit' })
    @ApiParam({ name: 'productId', description: 'ID du produit', type: 'integer' })
    @ApiResponse({
      status: 200,
      description: 'Liste des vues du produit',
      type: [ProductViewResponseDto]
    })
    findAllByProductId(@Param('productId', ParseIntPipe) productId: number) {
      return this.productViewService.findAllByProductId(productId);
    }
  
    //@UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une vue par son ID' })
    @ApiParam({ name: 'id', description: 'ID de la vue', type: 'integer' })
    @ApiResponse({
      status: 200,
      description: 'Vue trouvée',
      type: ProductViewResponseDto
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.productViewService.findOne(id);
    }
  
    //@UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une vue' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    @ApiParam({ name: 'id', description: 'ID de la vue', type: 'integer' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          viewType: { 
            type: 'string',
            enum: Object.values(ViewType),
            example: 'BACK'
          },
          description: {
            type: 'string',
            example: 'Vue arrière mise à jour'
          },
          image: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    })
    @ApiResponse({
      status: 200,
      description: 'Vue mise à jour',
      type: ProductViewResponseDto
    })
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body('viewType') viewType: ViewType,
      @Body('description') description: string,
      @UploadedFile() file?: Express.Multer.File
    ) {
      return this.productViewService.update(id, viewType, description, file);
    }
  
    //@UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une vue' })
    @ApiParam({ name: 'id', description: 'ID de la vue', type: 'integer' })
    @ApiResponse({ status: 204, description: 'Vue supprimée' })
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.productViewService.remove(id);
    }
  }