import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MockupService } from '../services/mockup.service';
import { CreateMockupDto, UpdateMockupDto, MockupResponseDto, MockupGenre } from '../dto/create-mockup.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mockups')
@Controller('mockups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  /**
   * POST /mockups - Créer un mockup avec genre
   */
  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Créer un mockup', description: 'Crée un nouveau mockup avec le champ genre (HOMME, FEMME, BEBE, UNISEXE)' })
  @ApiBody({ type: CreateMockupDto, description: 'Données du mockup à créer' })
  @ApiResponse({ status: 201, description: 'Mockup créé avec succès', type: MockupResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createMockup(@Body() createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    return await this.mockupService.createMockup(createMockupDto);
  }

  /**
   * PATCH /mockups/:id - Mettre à jour un mockup avec genre
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Mettre à jour un mockup',
    description: 'Met à jour un mockup existant, y compris son genre'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du mockup à mettre à jour',
    type: 'number'
  })
  @ApiBody({
    type: UpdateMockupDto,
    description: 'Données à mettre à jour'
  })
  @ApiResponse({
    status: 200,
    description: 'Mockup mis à jour avec succès',
    type: MockupResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Mockup introuvable'
  })
  async updateMockup(
    @Param('id') id: number,
    @Body() updateMockupDto: UpdateMockupDto
  ): Promise<MockupResponseDto> {
    return await this.mockupService.updateMockup(id, updateMockupDto);
  }

  /**
   * GET /mockups/by-genre/:genre - Récupérer les mockups par genre
   */
  @Get('by-genre/:genre')
  @ApiOperation({
    summary: 'Récupérer les mockups par genre',
    description: 'Récupère tous les mockups d\'un genre spécifique'
  })
  @ApiParam({
    name: 'genre',
    description: 'Genre des mockups à récupérer',
    enum: MockupGenre
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des mockups du genre spécifié',
    type: [MockupResponseDto]
  })
  async getMockupsByGenre(
    @Param('genre') genre: MockupGenre
  ): Promise<MockupResponseDto[]> {
    return await this.mockupService.getMockupsByGenre(genre);
  }

  /**
   * GET /mockups/genres - Récupérer tous les genres disponibles
   */
  @Get('genres')
  @ApiOperation({
    summary: 'Récupérer les genres disponibles',
    description: 'Récupère la liste de tous les genres disponibles pour les mockups'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des genres disponibles',
    type: [String]
  })
  async getAvailableMockupGenres(): Promise<string[]> {
    return await this.mockupService.getAvailableMockupGenres();
  }

  /**
   * GET /mockups - Récupérer tous les mockups avec filtre par genre
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les mockups',
    description: 'Récupère tous les mockups avec possibilité de filtrer par genre'
  })
  @ApiQuery({
    name: 'genre',
    description: 'Filtrer par genre (optionnel)',
    enum: MockupGenre,
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les mockups',
    type: [MockupResponseDto]
  })
  async getAllMockups(
    @Query('genre') genre?: MockupGenre
  ): Promise<MockupResponseDto[]> {
    return await this.mockupService.getAllMockups(genre);
  }

  /**
   * GET /mockups/:id - Récupérer un mockup par ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un mockup par ID',
    description: 'Récupère les détails d\'un mockup spécifique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du mockup à récupérer',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du mockup',
    type: MockupResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Mockup introuvable'
  })
  async getMockupById(@Param('id') id: number): Promise<MockupResponseDto> {
    return await this.mockupService.getMockupById(id);
  }

  /**
   * DELETE /mockups/:id - Supprimer un mockup
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Supprimer un mockup',
    description: 'Supprime un mockup (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du mockup à supprimer',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Mockup supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Mockup introuvable'
  })
  async deleteMockup(@Param('id') id: number): Promise<{ success: boolean; message: string }> {
    return await this.mockupService.deleteMockup(id);
  }
} 