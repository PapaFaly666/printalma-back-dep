import { Controller, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PublicUsersService } from './public-users.service';
import { VendorUserResponseDto } from './dto/vendor-user-response.dto';

@ApiTags('Public Users')
@Controller('public/users')
export class PublicUsersController {
  constructor(private readonly publicUsersService: PublicUsersService) {}

  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors (DESIGNER, INFLUENCEUR, ARTISTE)' })
  @ApiResponse({
    status: 200,
    description: 'List of all vendors',
    type: [VendorUserResponseDto]
  })
  async getAllVendors() {
    try {
      const vendors = await this.publicUsersService.getVendorsByType();
      return {
        success: true,
        data: vendors,
        total: vendors.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch vendors',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('vendors/type/:type')
  @ApiOperation({ summary: 'Get vendors by specific type' })
  @ApiParam({
    name: 'type',
    enum: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE'],
    description: 'Type of vendor to filter by'
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendors filtered by type',
    type: [VendorUserResponseDto]
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid vendor type'
  })
  async getVendorsByType(@Param('type') type: string) {
    const validTypes = ['DESIGNER', 'INFLUENCEUR', 'ARTISTE'];

    if (!validTypes.includes(type)) {
      throw new HttpException(
        {
          success: false,
          message: 'Invalid vendor type. Must be one of: DESIGNER, INFLUENCEUR, ARTISTE'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const vendors = await this.publicUsersService.getVendorsByType(type as any);
      return {
        success: true,
        data: vendors,
        total: vendors.length,
        type: type
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch vendors by type',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('vendors/categorized')
  @ApiOperation({ summary: 'Get vendors categorized by type' })
  @ApiResponse({
    status: 200,
    description: 'Vendors categorized by type (DESIGNER, INFLUENCEUR, ARTISTE)'
  })
  async getVendorsCategorized() {
    try {
      const categorizedVendors = await this.publicUsersService.getVendorsByTypes();
      const total = Object.values(categorizedVendors).reduce((sum, vendors) => sum + vendors.length, 0);

      return {
        success: true,
        data: categorizedVendors,
        total: total,
        counts: {
          DESIGNER: categorizedVendors.DESIGNER.length,
          INFLUENCEUR: categorizedVendors.INFLUENCEUR.length,
          ARTISTE: categorizedVendors.ARTISTE.length
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch categorized vendors',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor details',
    type: VendorUserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found'
  })
  async getVendorById(@Param('id') id: string) {
    const vendorId = parseInt(id, 10);

    if (isNaN(vendorId)) {
      throw new HttpException(
        {
          success: false,
          message: 'Invalid vendor ID'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const vendor = await this.publicUsersService.getVendorById(vendorId);

      if (!vendor) {
        throw new HttpException(
          {
            success: false,
            message: 'Vendor not found'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: vendor
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch vendor',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}