import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe, 
  HttpStatus, 
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { multerConfig } from '../../multerConfig';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Colors')
@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  //@UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle couleur' })
  @ApiResponse({ status: 201, description: 'Couleur créée avec succès' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          example: 'Rouge' 
        },
        hexCode: { 
          type: 'string', 
          example: '#FF0000' 
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image de la couleur'
        },
      },
      required: ['name', 'image'],
    },
  })
  async create(
    @Body() createColorDto: CreateColorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('L\'image est obligatoire');
    }
    return this.colorService.create(createColorDto, file);
  }

  //@UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les couleurs' })
  @ApiResponse({ status: 200, description: 'Liste des couleurs' })
  findAll() {
    return this.colorService.findAll();
  }

  //@UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une couleur par ID' })
  @ApiResponse({ status: 200, description: 'Couleur trouvée' })
  @ApiResponse({ status: 404, description: 'Couleur non trouvée' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.colorService.findOne(id);
  }

  //@UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une couleur par ID' })
  @ApiResponse({ status: 204, description: 'Couleur supprimée' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.colorService.remove(id);
  }

  //@UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter des images supplémentaires à une couleur' })
  @ApiResponse({ status: 201, description: 'Images ajoutées avec succès' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Images supplémentaires pour la couleur (max 10)'
        },
      },
      required: ['images'],
    },
  })
  async addImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Au moins une image doit être fournie');
    }
    return this.colorService.addColorImages(id, files);
  }

  //@UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter une image supplémentaire à une couleur' })
  @ApiResponse({ status: 201, description: 'Image ajoutée avec succès' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image supplémentaire pour la couleur'
        },
      },
      required: ['image'],
    },
  })
  async addImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('L\'image est obligatoire');
    }
    return this.colorService.addColorImage(id, file);
  }

  //@UseGuards(JwtAuthGuard)
  @Patch(':id/main-image')
  @ApiOperation({ summary: 'Mettre à jour l\'image principale d\'une couleur' })
  @ApiResponse({ status: 200, description: 'Image principale mise à jour avec succès' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Nouvelle image principale pour la couleur'
        },
      },
      required: ['image'],
    },
  })
  async updateMainImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('L\'image est obligatoire');
    }
    return this.colorService.updateMainImage(id, file);
  }
}