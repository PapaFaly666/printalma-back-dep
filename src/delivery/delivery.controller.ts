import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { CreateInternationalZoneDto, UpdateInternationalZoneDto } from './dto/international-zone.dto';
import { CreateTransporteurDto, UpdateTransporteurDto } from './dto/transporteur.dto';
import { CreateZoneTarifDto, UpdateZoneTarifDto } from './dto/zone-tarif.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ========================================
  // CITIES (Villes Dakar & Banlieue)
  // ========================================

  @Get('cities')
  @ApiOperation({ summary: 'Récupère toutes les villes' })
  @ApiQuery({ name: 'zoneType', required: false, enum: ['dakar-ville', 'banlieue'] })
  @ApiResponse({ status: 200, description: 'Liste des villes récupérée avec succès' })
  getCities(@Query('zoneType') zoneType?: string) {
    return this.deliveryService.getCities(zoneType);
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Récupère une ville par son ID' })
  @ApiResponse({ status: 200, description: 'Ville récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Ville non trouvée' })
  getCityById(@Param('id') id: string) {
    return this.deliveryService.getCityById(id);
  }

  @Post('cities')
  @ApiOperation({ summary: 'Crée une nouvelle ville' })
  @ApiResponse({ status: 201, description: 'Ville créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  createCity(@Body() createCityDto: CreateCityDto) {
    return this.deliveryService.createCity(createCityDto);
  }

  @Put('cities/:id')
  @ApiOperation({ summary: 'Met à jour une ville' })
  @ApiResponse({ status: 200, description: 'Ville mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Ville non trouvée' })
  updateCity(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.deliveryService.updateCity(id, updateCityDto);
  }

  @Delete('cities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une ville' })
  @ApiResponse({ status: 204, description: 'Ville supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Ville non trouvée' })
  deleteCity(@Param('id') id: string) {
    return this.deliveryService.deleteCity(id);
  }

  @Patch('cities/:id/toggle-status')
  @ApiOperation({ summary: 'Change le statut d\'une ville (active ↔ inactive)' })
  @ApiResponse({ status: 200, description: 'Statut de la ville modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Ville non trouvée' })
  toggleCityStatus(@Param('id') id: string) {
    return this.deliveryService.toggleCityStatus(id);
  }

  // ========================================
  // REGIONS (13 Régions du Sénégal)
  // ========================================

  @Get('regions')
  @ApiOperation({ summary: 'Récupère toutes les régions' })
  @ApiResponse({ status: 200, description: 'Liste des régions récupérée avec succès' })
  getRegions() {
    return this.deliveryService.getRegions();
  }

  @Get('regions/:id')
  @ApiOperation({ summary: 'Récupère une région par son ID' })
  @ApiResponse({ status: 200, description: 'Région récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Région non trouvée' })
  getRegionById(@Param('id') id: string) {
    return this.deliveryService.getRegionById(id);
  }

  @Post('regions')
  @ApiOperation({ summary: 'Crée une nouvelle région' })
  @ApiResponse({ status: 201, description: 'Région créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Une région avec ce nom existe déjà' })
  createRegion(@Body() createRegionDto: CreateRegionDto) {
    return this.deliveryService.createRegion(createRegionDto);
  }

  @Put('regions/:id')
  @ApiOperation({ summary: 'Met à jour une région' })
  @ApiResponse({ status: 200, description: 'Région mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Région non trouvée' })
  @ApiResponse({ status: 409, description: 'Une région avec ce nom existe déjà' })
  updateRegion(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.deliveryService.updateRegion(id, updateRegionDto);
  }

  @Delete('regions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une région' })
  @ApiResponse({ status: 204, description: 'Région supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Région non trouvée' })
  deleteRegion(@Param('id') id: string) {
    return this.deliveryService.deleteRegion(id);
  }

  @Patch('regions/:id/toggle-status')
  @ApiOperation({ summary: 'Change le statut d\'une région (active ↔ inactive)' })
  @ApiResponse({ status: 200, description: 'Statut de la région modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Région non trouvée' })
  toggleRegionStatus(@Param('id') id: string) {
    return this.deliveryService.toggleRegionStatus(id);
  }

  // ========================================
  // INTERNATIONAL ZONES
  // ========================================

  @Get('international-zones')
  @ApiOperation({ summary: 'Récupère toutes les zones internationales' })
  @ApiResponse({ status: 200, description: 'Liste des zones internationales récupérée avec succès' })
  getInternationalZones() {
    return this.deliveryService.getInternationalZones();
  }

  @Get('international-zones/:id')
  @ApiOperation({ summary: 'Récupère une zone internationale par son ID' })
  @ApiResponse({ status: 200, description: 'Zone internationale récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Zone internationale non trouvée' })
  getInternationalZoneById(@Param('id') id: string) {
    return this.deliveryService.getInternationalZoneById(id);
  }

  @Post('international-zones')
  @ApiOperation({ summary: 'Crée une nouvelle zone internationale' })
  @ApiResponse({ status: 201, description: 'Zone internationale créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  createInternationalZone(@Body() createZoneDto: CreateInternationalZoneDto) {
    return this.deliveryService.createInternationalZone(createZoneDto);
  }

  @Put('international-zones/:id')
  @ApiOperation({ summary: 'Met à jour une zone internationale' })
  @ApiResponse({ status: 200, description: 'Zone internationale mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Zone internationale non trouvée' })
  updateInternationalZone(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateInternationalZoneDto,
  ) {
    return this.deliveryService.updateInternationalZone(id, updateZoneDto);
  }

  @Delete('international-zones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une zone internationale' })
  @ApiResponse({ status: 204, description: 'Zone internationale supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Zone internationale non trouvée' })
  deleteInternationalZone(@Param('id') id: string) {
    return this.deliveryService.deleteInternationalZone(id);
  }

  @Patch('international-zones/:id/toggle-status')
  @ApiOperation({ summary: 'Change le statut d\'une zone internationale (active ↔ inactive)' })
  @ApiResponse({ status: 200, description: 'Statut de la zone internationale modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Zone internationale non trouvée' })
  toggleInternationalZoneStatus(@Param('id') id: string) {
    return this.deliveryService.toggleInternationalZoneStatus(id);
  }

  // ========================================
  // TRANSPORTEURS
  // ========================================

  @Get('transporteurs')
  @ApiOperation({ summary: 'Récupère tous les transporteurs' })
  @ApiResponse({ status: 200, description: 'Liste des transporteurs récupérée avec succès' })
  getTransporteurs() {
    return this.deliveryService.getTransporteurs();
  }

  @Get('transporteurs/:id')
  @ApiOperation({ summary: 'Récupère un transporteur par son ID' })
  @ApiResponse({ status: 200, description: 'Transporteur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Transporteur non trouvé' })
  getTransporteurById(@Param('id') id: string) {
    return this.deliveryService.getTransporteurById(id);
  }

  @Post('transporteurs')
  @ApiOperation({ summary: 'Crée un nouveau transporteur' })
  @ApiResponse({ status: 201, description: 'Transporteur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  createTransporteur(@Body() createTransporteurDto: CreateTransporteurDto) {
    return this.deliveryService.createTransporteur(createTransporteurDto);
  }

  @Put('transporteurs/:id')
  @ApiOperation({ summary: 'Met à jour un transporteur' })
  @ApiResponse({ status: 200, description: 'Transporteur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Transporteur non trouvé' })
  updateTransporteur(
    @Param('id') id: string,
    @Body() updateTransporteurDto: UpdateTransporteurDto,
  ) {
    return this.deliveryService.updateTransporteur(id, updateTransporteurDto);
  }

  @Delete('transporteurs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un transporteur' })
  @ApiResponse({ status: 204, description: 'Transporteur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Transporteur non trouvé' })
  deleteTransporteur(@Param('id') id: string) {
    return this.deliveryService.deleteTransporteur(id);
  }

  @Patch('transporteurs/:id/toggle-status')
  @ApiOperation({ summary: 'Change le statut d\'un transporteur (active ↔ inactive)' })
  @ApiResponse({ status: 200, description: 'Statut du transporteur modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Transporteur non trouvé' })
  toggleTransporteurStatus(@Param('id') id: string) {
    return this.deliveryService.toggleTransporteurStatus(id);
  }

  // ========================================
  // ZONE TARIFS
  // ========================================

  @Get('zone-tarifs')
  @ApiOperation({ summary: 'Récupère tous les tarifs de zones' })
  @ApiResponse({ status: 200, description: 'Liste des tarifs de zones récupérée avec succès' })
  getZoneTarifs() {
    return this.deliveryService.getZoneTarifs();
  }

  @Get('zone-tarifs/:id')
  @ApiOperation({ summary: 'Récupère un tarif de zone par son ID' })
  @ApiResponse({ status: 200, description: 'Tarif de zone récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Tarif de zone non trouvé' })
  getZoneTarifById(@Param('id') id: string) {
    return this.deliveryService.getZoneTarifById(id);
  }

  @Post('zone-tarifs')
  @ApiOperation({ summary: 'Crée un nouveau tarif de zone' })
  @ApiResponse({ status: 201, description: 'Tarif de zone créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  createZoneTarif(@Body() createZoneTarifDto: CreateZoneTarifDto) {
    return this.deliveryService.createZoneTarif(createZoneTarifDto);
  }

  @Put('zone-tarifs/:id')
  @ApiOperation({ summary: 'Met à jour un tarif de zone' })
  @ApiResponse({ status: 200, description: 'Tarif de zone mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Tarif de zone non trouvé' })
  updateZoneTarif(
    @Param('id') id: string,
    @Body() updateZoneTarifDto: UpdateZoneTarifDto,
  ) {
    return this.deliveryService.updateZoneTarif(id, updateZoneTarifDto);
  }

  @Delete('zone-tarifs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un tarif de zone' })
  @ApiResponse({ status: 204, description: 'Tarif de zone supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Tarif de zone non trouvé' })
  deleteZoneTarif(@Param('id') id: string) {
    return this.deliveryService.deleteZoneTarif(id);
  }

  @Patch('zone-tarifs/:id/toggle-status')
  @ApiOperation({ summary: 'Change le statut d\'un tarif de zone (active ↔ inactive)' })
  @ApiResponse({ status: 200, description: 'Statut du tarif de zone modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Tarif de zone non trouvé' })
  toggleZoneTarifStatus(@Param('id') id: string) {
    return this.deliveryService.toggleZoneTarifStatus(id);
  }

  // ========================================
  // TRANSPORTEURS PAR ZONE
  // ========================================

  @Get('transporteurs/by-zone')
  @ApiOperation({ summary: 'Récupère les transporteurs disponibles pour une zone spécifique' })
  @ApiQuery({ name: 'cityId', required: false, description: 'ID de la ville' })
  @ApiQuery({ name: 'regionId', required: false, description: 'ID de la région' })
  @ApiQuery({ name: 'internationalZoneId', required: false, description: 'ID de la zone internationale' })
  @ApiResponse({
    status: 200,
    description: 'Transporteurs disponibles récupérés avec succès',
    schema: {
      properties: {
        transporteurs: {
          type: 'array',
          items: {
            properties: {
              transporteur: { type: 'object' },
              tarif: { type: 'object' },
              deliveryFee: { type: 'number' },
              deliveryTime: { type: 'string' }
            }
          }
        }
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  getTransporteursByZone(
    @Query('cityId') cityId?: string,
    @Query('regionId') regionId?: string,
    @Query('internationalZoneId') internationalZoneId?: string,
  ) {
    return this.deliveryService.getTransporteursByZone(cityId, regionId, internationalZoneId);
  }

  // ========================================
  // CALCUL DE FRAIS DE LIVRAISON
  // ========================================

  @Get('calculate-fee')
  @ApiOperation({ summary: 'Calcule les frais de livraison pour une commande' })
  @ApiQuery({ name: 'cityId', required: false, description: 'ID de la ville' })
  @ApiQuery({ name: 'regionId', required: false, description: 'ID de la région' })
  @ApiQuery({ name: 'internationalZoneId', required: false, description: 'ID de la zone internationale' })
  @ApiResponse({
    status: 200,
    description: 'Frais de livraison calculés avec succès',
    schema: {
      properties: {
        fee: { type: 'number', example: 1500 },
        deliveryTime: { type: 'string', example: '24-48 heures' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  calculateDeliveryFee(
    @Query('cityId') cityId?: string,
    @Query('regionId') regionId?: string,
    @Query('internationalZoneId') internationalZoneId?: string,
  ) {
    return this.deliveryService.calculateDeliveryFee(cityId, regionId, internationalZoneId);
  }
}
