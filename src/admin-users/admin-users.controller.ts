import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/permissions.decorator';
import { RequestWithUser } from '../auth/jwt.strategy';

@ApiBearerAuth()
@ApiTags('Admin - Users Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs avec filtres et pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom ou email' })
  @ApiQuery({ name: 'roleId', required: false, description: 'Filtrer par rôle' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre par page' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée',
  })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Récupérer les statistiques des utilisateurs' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées',
  })
  getStats() {
    return this.adminUsersService.getStats();
  }

  @Get(':id')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur récupéré',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
    const createdBy = req.user.sub;
    return this.adminUsersService.create(createUserDto, createdBy);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.adminUsersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const deletedBy = req.user.sub;
    return this.adminUsersService.remove(id, deletedBy);
  }

  @Post(':id/reset-password')
  @RequirePermissions('users.reset_password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    return this.adminUsersService.resetPassword(id, resetPasswordDto);
  }

  @Patch(':id/status')
  @RequirePermissions('users.update_status')
  @ApiOperation({ summary: 'Changer le statut d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    return this.adminUsersService.updateStatus(id, updateStatusDto);
  }

  @Get(':id/permissions')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Récupérer les permissions d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Permissions récupérées',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.getUserPermissions(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('users.manage_permissions')
  @ApiOperation({
    summary: 'Attribuer des permissions personnalisées à un utilisateur',
    description: 'Crée un rôle personnalisé unique pour l\'utilisateur avec les permissions spécifiées. Si l\'utilisateur avait déjà un rôle personnalisé, il sera remplacé.'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Permissions attribuées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur ou permissions non trouvés',
  })
  assignCustomPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ) {
    return this.adminUsersService.assignCustomPermissions(id, assignPermissionsDto);
  }

  @Post(':id/permissions/reset')
  @RequirePermissions('users.manage_permissions')
  @ApiOperation({
    summary: 'Réinitialiser les permissions d\'un utilisateur',
    description: 'Remplace le rôle personnalisé de l\'utilisateur par un rôle de base. Supprime automatiquement l\'ancien rôle personnalisé s\'il n\'est utilisé par aucun autre utilisateur.'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Permissions réinitialisées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur ou rôle non trouvé',
  })
  resetUserPermissions(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { roleId: number }
  ) {
    return this.adminUsersService.resetUserPermissions(userId, body.roleId);
  }
}
