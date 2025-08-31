import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UpdateDesignPositionDto } from '../dto/update-design-position.dto';
import { VendorDesignPositionService } from '../services/vendor-design-position.service';
import { ApiTags } from '@nestjs/swagger';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Vendor Product Design Positioning (Legacy)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDEUR)
@Controller('vendor-products/:vpId/designs/:designId/position')
export class VendorDesignPositionController {
  constructor(private readonly service: VendorDesignPositionService) {}

  @Get()
  async get(
    @Req() req: any,
    @Param('vpId') vpId: string,
    @Param('designId') designId: string,
  ) {
    const vendorId = req.user.id;
    // Basic validation to ensure the product belongs to the vendor
    const product = await this.service['prisma'].vendorProduct.findFirst({
        where: { id: Number(vpId), vendorId: vendorId }
    });
    if (!product) {
        throw new ForbiddenException('Access to this resource is denied');
    }
    const data = await this.service.getPosition(Number(vpId), Number(designId));
    return { success: true, data };
  }

  @Put()
  async upsert(
    @Req() req: any,
    @Param('vpId') vpId: string,
    @Param('designId') designId: string,
    @Body() dto: UpdateDesignPositionDto,
  ) {
    const vendorId = req.user.id;
    await this.service.upsertPosition(vendorId, Number(vpId), Number(designId), dto);
    return { success: true };
  }
} 
 
 
 
 