import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Admin - Roles & Permissions')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Récupérer tous les rôles avec leurs permissions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles récupérée',
  })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('available-for-users')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Récupérer les rôles disponibles pour créer des utilisateurs (exclut vendor)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles disponibles récupérée',
  })
  getAvailableRoles() {
    return this.rolesService.getAvailableRolesForUsers();
  }

  @Get(':id')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Récupérer un rôle par ID' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle récupéré',
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Créer un nouveau rôle' })
  @ApiResponse({
    status: 201,
    description: 'Rôle créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug déjà utilisé',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour',
  })
  @ApiResponse({
    status: 400,
    description: 'Rôle système non modifiable',
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle supprimé',
  })
  @ApiResponse({
    status: 400,
    description: 'Rôle système non supprimable ou utilisé par des utilisateurs',
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}

@ApiBearerAuth()
@ApiTags('Admin - Roles & Permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('permissions.view')
  @ApiOperation({ summary: 'Récupérer toutes les permissions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des permissions récupérée',
  })
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get('by-module')
  @RequirePermissions('permissions.view')
  @ApiOperation({ summary: 'Récupérer les permissions groupées par module' })
  @ApiResponse({
    status: 200,
    description: 'Permissions groupées par module',
  })
  getPermissionsByModule() {
    return this.rolesService.getPermissionsByModule();
  }
}
