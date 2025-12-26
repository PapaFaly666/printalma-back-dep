import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StickerService } from './sticker.service';
import { PublicStickerQueryDto } from './dto/sticker-query.dto';

@ApiTags('Public Stickers')
@Controller('public/stickers')
export class PublicStickerController {
  constructor(private readonly stickerService: StickerService) {}

  @Get()
  @ApiOperation({ summary: 'Liste publique des stickers' })
  @ApiResponse({ status: 200, description: 'Liste des stickers publiés' })
  async findAll(@Query() query: PublicStickerQueryDto) {
    return this.stickerService.findAllPublic(query);
  }

  @Get('configurations')
  @ApiOperation({ summary: 'Obtenir les configurations disponibles (tailles, finitions, formes)' })
  @ApiResponse({ status: 200, description: 'Configurations disponibles' })
  async getConfigurations() {
    return this.stickerService.getConfigurations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un sticker public' })
  @ApiResponse({ status: 200, description: 'Détails du sticker' })
  @ApiResponse({ status: 404, description: 'Sticker introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stickerService.findOne(id);
  }
}
