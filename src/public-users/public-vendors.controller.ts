import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VendorTypeService } from '../vendor-type/vendor-type.service';

@ApiTags('Public Vendors')
@Controller('public/vendors')
export class PublicVendorsController {
  constructor(private readonly vendorTypeService: VendorTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les vendeurs avec leurs designs et produits (PUBLIC)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des vendeurs avec leurs designs et produits',
    schema: {
      type: 'object',
      properties: {
        vendors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              shopName: { type: 'string' },
              designs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    imageUrl: { type: 'string' },
                    price: { type: 'number' },
                    views: { type: 'number' },
                    likes: { type: 'number' },
                    earnings: { type: 'number' },
                  }
                }
              },
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'number' },
                    salesCount: { type: 'number' },
                    totalRevenue: { type: 'number' },
                  }
                }
              }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'vendorTypeId', required: false, type: Number, description: 'Filter by vendor type ID' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Filter by country' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by vendor name or shop name' })
  async findAllVendorsWithDesignsAndProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vendorTypeId') vendorTypeId?: string,
    @Query('country') country?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const vendorTypeIdNum = vendorTypeId ? parseInt(vendorTypeId, 10) : undefined;

    return this.vendorTypeService.findAllVendorsWithDesignsAndProducts(
      pageNum,
      limitNum,
      vendorTypeIdNum,
      country,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Récupérer les vendeurs en vedette avec leurs designs et produits (PUBLIC)' })
  @ApiResponse({
    status: 200,
    description: 'Vendeurs en vedette avec leurs designs et produits',
    schema: {
      type: 'object',
      properties: {
        vendors: {
          type: 'array',
          items: { type: 'object' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of featured vendors to return' })
  async getFeaturedVendors(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;

    return this.vendorTypeService.findAllVendorsWithDesignsAndProducts(
      1,
      limitNum,
      undefined,
      undefined,
    );
  }

  @Get(':vendorId')
  @ApiOperation({ summary: "Récupérer un vendeur spécifique avec ses designs et produits (PUBLIC)" })
  @ApiResponse({
    status: 200,
    description: 'Vendeur avec ses designs et produits',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        shopName: { type: 'string' },
        designs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              imageUrl: { type: 'string' },
              price: { type: 'number' },
              views: { type: 'number' },
              likes: { type: 'number' },
              earnings: { type: 'number' },
            }
          }
        },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'number' },
              salesCount: { type: 'number' },
              totalRevenue: { type: 'number' },
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Vendeur introuvable' })
  async findVendorWithDesignsAndProducts(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.vendorTypeService.findVendorWithDesignsAndProducts(vendorId);
  }

  @Get('by-country/:country')
  @ApiOperation({ summary: 'Récupérer les vendeurs par pays avec leurs designs et produits (PUBLIC)' })
  @ApiResponse({
    status: 200,
    description: 'Vendeurs du pays spécifié avec leurs designs et produits',
    schema: {
      type: 'object',
      properties: {
        vendors: {
          type: 'array',
          items: { type: 'object' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getVendorsByCountry(
    @Param('country') country: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.vendorTypeService.findAllVendorsWithDesignsAndProducts(
      pageNum,
      limitNum,
      undefined,
      country,
    );
  }
}