import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DesignerService } from './designer.service';
import { CreateDesignerDto } from './dto/create-designer.dto';
import { UpdateDesignerDto } from './dto/update-designer.dto';
import { UpdateFeaturedDesignersDto } from './dto/update-featured-designers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('designers')
export class DesignerController {
  constructor(private readonly designerService: DesignerService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lister tous les designers (Admin)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  async getAllDesigners() {
    return this.designerService.getAllDesigners();
  }

  /**
   * Créer un designer (Admin)
   */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('avatar'))
  @HttpCode(HttpStatus.CREATED)
  async createDesigner(
    @Body() createDto: CreateDesignerDto,
    @UploadedFile() avatar: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.designerService.createDesigner(
      createDto,
      avatar,
      req.user.id,
    );
  }

  /**
   * Modifier un designer (Admin)
   */
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('avatar'))
  @HttpCode(HttpStatus.OK)
  async updateDesigner(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDesignerDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.designerService.updateDesigner(id, updateDto, avatar);
  }

  /**
   * Supprimer un designer (Admin)
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDesigner(@Param('id', ParseIntPipe) id: number) {
    await this.designerService.deleteDesigner(id);
  }

  /**
   * Lister les designers en vedette (Public)
   */
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async getFeaturedDesigners() {
    return this.designerService.getFeaturedDesigners();
  }

  /**
   * Mettre à jour les designers en vedette (Admin)
   */
  @Put('featured/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  async updateFeaturedDesigners(
    @Body() updateDto: UpdateFeaturedDesignersDto,
  ) {
    return this.designerService.updateFeaturedDesigners(updateDto.designerIds);
  }
}
