import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { VendorFundsService } from './vendor-funds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  VendorFundsRequestFiltersDto,
  CreateFundsRequestDto,
  VendorEarningsResponseDto,
  VendorFundsRequestResponseDto,
  VendorFundsRequestsListResponseDto,
} from './dto/vendor-funds.dto';

@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDEUR)
export class VendorFundsController {
  constructor(private readonly vendorFundsService: VendorFundsService) {}

  /**
   * 1. Récupérer les gains du vendeur
   * GET /vendor/earnings
   */
  @Get('earnings')
  async getVendorEarnings(@Req() req: any): Promise<VendorEarningsResponseDto> {
    try {
      const vendorId = req.user.sub || req.user.id;
      const earnings = await this.vendorFundsService.getVendorEarnings(vendorId);

      return {
        success: true,
        message: 'Gains récupérés avec succès',
        data: earnings,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des gains',
        data: null,
      };
    }
  }

  /**
   * 2. Récupérer les demandes du vendeur
   * GET /vendor/funds-requests
   */
  @Get('funds-requests')
  async getVendorFundsRequests(
    @Query() filters: VendorFundsRequestFiltersDto,
    @Req() req: any,
  ): Promise<VendorFundsRequestsListResponseDto> {
    try {
      const vendorId = req.user.sub || req.user.id;
      const result = await this.vendorFundsService.getVendorFundsRequests(
        vendorId,
        filters,
      );

      return {
        success: true,
        message: 'Demandes récupérées avec succès',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des demandes',
        data: null,
      };
    }
  }

  /**
   * 3. Créer une demande d'appel de fonds
   * POST /vendor/funds-requests
   */
  @Post('funds-requests')
  async createFundsRequest(
    @Body() createData: CreateFundsRequestDto,
    @Req() req: any,
  ): Promise<VendorFundsRequestResponseDto> {
    try {
      const vendorId = req.user.sub || req.user.id;
      const request = await this.vendorFundsService.createFundsRequest(
        vendorId,
        createData,
      );

      return {
        success: true,
        message: 'Demande créée avec succès',
        data: request,
        statusCode: 201,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la demande',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * 4. Récupérer les détails d'une demande
   * GET /vendor/funds-requests/:requestId
   */
  @Get('funds-requests/:requestId')
  async getFundsRequestDetails(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Req() req: any,
  ): Promise<VendorFundsRequestResponseDto> {
    try {
      const vendorId = req.user.sub || req.user.id;
      const request = await this.vendorFundsService.getFundsRequestDetails(
        vendorId,
        requestId,
      );

      return {
        success: true,
        message: 'Détails de demande récupérés avec succès',
        data: request,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des détails',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * 5. Annuler une demande en attente
   * PATCH /vendor/funds-requests/:requestId/cancel
   */
  @Patch('funds-requests/:requestId/cancel')
  async cancelFundsRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Req() req: any,
  ): Promise<VendorFundsRequestResponseDto> {
    try {
      const vendorId = req.user.sub || req.user.id;
      const request = await this.vendorFundsService.cancelFundsRequest(
        vendorId,
        requestId,
      );

      return {
        success: true,
        message: 'Demande annulée avec succès',
        data: request,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'annulation de la demande',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }
}