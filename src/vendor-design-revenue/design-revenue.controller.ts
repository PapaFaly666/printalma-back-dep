import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { DesignRevenueService } from '../services/designRevenueService';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Vendor Design Revenues')
@Controller('vendor/design-revenues')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DesignRevenueController {
  constructor(private readonly designRevenueService: DesignRevenueService) {}

  @Get('stats')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get revenue statistics for the vendor' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year', 'all'], description: 'Period for statistics' })
  @ApiResponse({ status: 200, description: 'Revenue statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getRevenueStats(@Request() req, @Query('period') period: string = 'month') {
    try {
      const vendorId = req.user.id;
      const stats = await this.designRevenueService.getRevenueStats(vendorId, period);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch revenue statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('designs')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get list of designs with their revenues' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year', 'all'], description: 'Filter by period' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['revenue', 'usage', 'recent'], description: 'Sort by criteria' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by design name' })
  @ApiResponse({ status: 200, description: 'Designs list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getDesignRevenues(
    @Request() req,
    @Query('period') period?: string,
    @Query('sortBy') sortBy?: string,
    @Query('search') search?: string
  ) {
    try {
      const vendorId = req.user.id;
      const designs = await this.designRevenueService.getDesignRevenues(vendorId, {
        period,
        sortBy,
        search
      });
      return {
        success: true,
        data: designs
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch design revenues',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('designs/:designId/history')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get usage history for a specific design' })
  @ApiParam({ name: 'designId', description: 'ID of the design' })
  @ApiResponse({ status: 200, description: 'Design history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  @ApiResponse({ status: 404, description: 'Design not found or does not belong to vendor' })
  async getDesignRevenueHistory(@Request() req, @Param('designId') designId: string) {
    try {
      const vendorId = req.user.id;
      const history = await this.designRevenueService.getDesignRevenueHistory(
        parseInt(designId),
        vendorId
      );
      return {
        success: true,
        data: history
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch design history',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('available-balance')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get available balance for payout' })
  @ApiResponse({ status: 200, description: 'Available balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getAvailableBalance(@Request() req) {
    try {
      const vendorId = req.user.id;
      const balance = await DesignRevenueService.getAvailableBalance(vendorId);
      return {
        success: true,
        data: { balance }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch available balance',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('payout')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Create a payout request' })
  @ApiResponse({ status: 201, description: 'Payout request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async createPayoutRequest(@Request() req, @Body() payoutData: any) {
    try {
      const vendorId = req.user.id;
      const { amount, bankAccountId } = payoutData;

      if (!amount || !bankAccountId) {
        throw new HttpException(
          'Amount and bank account ID are required',
          HttpStatus.BAD_REQUEST
        );
      }

      if (amount <= 0) {
        throw new HttpException(
          'Amount must be greater than 0',
          HttpStatus.BAD_REQUEST
        );
      }

      const payout = await DesignRevenueService.createPayoutRequest(vendorId, {
        bankAccountId: parseInt(bankAccountId),
        amount: parseFloat(amount)
      });

      return {
        success: true,
        data: {
          id: payout.id,
          amount: payout.amount.toNumber(),
          status: payout.status,
          requestedAt: payout.requestedAt,
          estimatedProcessingTime: '2-3 jours ouvrables'
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create payout request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('payouts')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get payout history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Payout history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getPayoutHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    try {
      const vendorId = req.user.id;
      const payouts = await DesignRevenueService.getPayoutHistory(vendorId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      return {
        success: true,
        data: payouts
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch payout history',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('bank-accounts')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get vendor bank accounts' })
  @ApiResponse({ status: 200, description: 'Bank accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getBankAccounts(@Request() req) {
    try {
      const vendorId = req.user.id;
      // TODO: Implement when VendorBankAccount model exists
      const accounts = [];

      // Mask account numbers for security
      const maskedAccounts = accounts.map(account => ({
        ...account,
        accountNumber: account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*')
      }));

      return {
        success: true,
        data: maskedAccounts
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch bank accounts',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('bank-accounts')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Add a new bank account' })
  @ApiResponse({ status: 201, description: 'Bank account added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bank account information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async addBankAccount(@Request() req, @Body() accountData: any) {
    try {
      const vendorId = req.user.id;
      const {
        bankName,
        accountNumber,
        accountHolderName,
        bankCode,
        branchCode,
        iban,
        swiftCode,
        accountType = 'CHECKING',
        mobileMoneyProvider,
        isDefault = false
      } = accountData;

      if (!bankName || !accountNumber || !accountHolderName) {
        throw new HttpException(
          'Bank name, account number, and account holder name are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // TODO: Implement when VendorBankAccount model exists
      const account = {
        id: 1,
        vendorId,
        bankName,
        accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
        accountHolderName,
        isDefault,
        isVerified: false,
        createdAt: new Date()
      };

      return {
        success: true,
        data: account
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add bank account',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('bank-accounts/:id/default')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Set bank account as default' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({ status: 200, description: 'Bank account set as default successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  async setDefaultBankAccount(@Request() req, @Param('id') id: string) {
    try {
      const vendorId = req.user.id;
      // TODO: Implement when VendorBankAccount model exists
      return {
        success: true,
        message: 'Bank account set as default successfully'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to set default bank account',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('bank-accounts/:id')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({ status: 200, description: 'Bank account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  async deleteBankAccount(@Request() req, @Param('id') id: string) {
    try {
      const vendorId = req.user.id;
      // TODO: Implement when VendorBankAccount and VendorPayout models exist
      return {
        success: true,
        message: 'Bank account deleted successfully'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete bank account',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('settings')
  @Roles('VENDEUR')
  @ApiOperation({ summary: 'Get revenue settings' })
  @ApiResponse({ status: 200, description: 'Revenue settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor access required' })
  async getRevenueSettings(@Request() req) {
    try {
      // TODO: Implement when DesignRevenueSettings model exists
      const settings = {
        commissionRate: 70,
        minimumPayoutAmount: 10000,
        payoutDelayDays: 7,
        payoutSchedule: 'ON_DEMAND'
      };

      return {
        success: true,
        data: {
          commissionRate: settings.commissionRate,
          minimumPayoutAmount: settings.minimumPayoutAmount,
          payoutDelayDays: settings.payoutDelayDays,
          payoutSchedule: settings.payoutSchedule
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch revenue settings',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}