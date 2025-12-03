import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { CreateInternationalZoneDto, UpdateInternationalZoneDto } from './dto/international-zone.dto';
import { CreateTransporteurDto, UpdateTransporteurDto } from './dto/transporteur.dto';
import { CreateZoneTarifDto, UpdateZoneTarifDto } from './dto/zone-tarif.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // CITIES (Villes Dakar & Banlieue)
  // ========================================

  async getCities(zoneType?: string) {
    const where = zoneType ? { zoneType } : {};
    return this.prisma.deliveryCity.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getCityById(id: string) {
    const city = await this.prisma.deliveryCity.findUnique({
      where: { id },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return city;
  }

  async createCity(data: CreateCityDto) {
    return this.prisma.deliveryCity.create({
      data: {
        ...data,
        price: new Decimal(data.price),
      },
    });
  }

  async updateCity(id: string, data: UpdateCityDto) {
    await this.getCityById(id); // Check if exists

    const updateData: any = { ...data };
    if (data.price !== undefined) {
      updateData.price = new Decimal(data.price);
    }

    return this.prisma.deliveryCity.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCity(id: string) {
    await this.getCityById(id); // Check if exists

    await this.prisma.deliveryCity.delete({
      where: { id },
    });
  }

  async toggleCityStatus(id: string) {
    const city = await this.getCityById(id);

    return this.prisma.deliveryCity.update({
      where: { id },
      data: {
        status: city.status === 'active' ? 'inactive' : 'active',
      },
    });
  }

  // ========================================
  // REGIONS (13 Régions du Sénégal)
  // ========================================

  async getRegions() {
    return this.prisma.deliveryRegion.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getRegionById(id: string) {
    const region = await this.prisma.deliveryRegion.findUnique({
      where: { id },
    });

    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    return region;
  }

  async createRegion(data: CreateRegionDto) {
    // Check if region name already exists
    const existing = await this.prisma.deliveryRegion.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Region with name ${data.name} already exists`);
    }

    return this.prisma.deliveryRegion.create({
      data: {
        ...data,
        price: new Decimal(data.price),
      },
    });
  }

  async updateRegion(id: string, data: UpdateRegionDto) {
    await this.getRegionById(id); // Check if exists

    // Check if new name conflicts with existing
    if (data.name) {
      const existing = await this.prisma.deliveryRegion.findUnique({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Region with name ${data.name} already exists`);
      }
    }

    const updateData: any = { ...data };
    if (data.price !== undefined) {
      updateData.price = new Decimal(data.price);
    }

    return this.prisma.deliveryRegion.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRegion(id: string) {
    await this.getRegionById(id); // Check if exists

    await this.prisma.deliveryRegion.delete({
      where: { id },
    });
  }

  async toggleRegionStatus(id: string) {
    const region = await this.getRegionById(id);

    return this.prisma.deliveryRegion.update({
      where: { id },
      data: {
        status: region.status === 'active' ? 'inactive' : 'active',
      },
    });
  }

  // ========================================
  // INTERNATIONAL ZONES
  // ========================================

  async getInternationalZones() {
    const zones = await this.prisma.deliveryInternationalZone.findMany({
      include: {
        countries: true,
      },
      orderBy: { name: 'asc' },
    });

    return zones.map(zone => ({
      ...zone,
      countries: zone.countries.map(c => c.country),
    }));
  }

  async getInternationalZoneById(id: string) {
    const zone = await this.prisma.deliveryInternationalZone.findUnique({
      where: { id },
      include: {
        countries: true,
      },
    });

    if (!zone) {
      throw new NotFoundException(`International zone with ID ${id} not found`);
    }

    return {
      ...zone,
      countries: zone.countries.map(c => c.country),
    };
  }

  async createInternationalZone(data: CreateInternationalZoneDto) {
    const { countries, ...zoneData } = data;

    return this.prisma.deliveryInternationalZone.create({
      data: {
        ...zoneData,
        price: new Decimal(zoneData.price),
        countries: {
          create: countries.map(country => ({ country })),
        },
      },
      include: {
        countries: true,
      },
    });
  }

  async updateInternationalZone(id: string, data: UpdateInternationalZoneDto) {
    await this.getInternationalZoneById(id); // Check if exists

    const { countries, ...zoneData } = data;

    const updateData: any = { ...zoneData };
    if (zoneData.price !== undefined) {
      updateData.price = new Decimal(zoneData.price);
    }

    // If countries provided, delete old ones and create new ones
    if (countries) {
      await this.prisma.deliveryInternationalCountry.deleteMany({
        where: { zoneId: id },
      });

      updateData.countries = {
        create: countries.map(country => ({ country })),
      };
    }

    return this.prisma.deliveryInternationalZone.update({
      where: { id },
      data: updateData,
      include: {
        countries: true,
      },
    });
  }

  async deleteInternationalZone(id: string) {
    await this.getInternationalZoneById(id); // Check if exists

    await this.prisma.deliveryInternationalZone.delete({
      where: { id },
    });
  }

  async toggleInternationalZoneStatus(id: string) {
    const zone = await this.getInternationalZoneById(id);

    return this.prisma.deliveryInternationalZone.update({
      where: { id },
      data: {
        status: zone.status === 'active' ? 'inactive' : 'active',
      },
      include: {
        countries: true,
      },
    });
  }

  // ========================================
  // TRANSPORTEURS
  // ========================================

  async getTransporteurs() {
    const transporteurs = await this.prisma.deliveryTransporteur.findMany({
      include: {
        zones: true,
      },
      orderBy: { name: 'asc' },
    });

    return transporteurs.map(t => ({
      ...t,
      deliveryZones: t.zones.map(z => z.zoneId),
    }));
  }

  async getTransporteurById(id: string) {
    const transporteur = await this.prisma.deliveryTransporteur.findUnique({
      where: { id },
      include: {
        zones: true,
      },
    });

    if (!transporteur) {
      throw new NotFoundException(`Transporteur with ID ${id} not found`);
    }

    return {
      ...transporteur,
      deliveryZones: transporteur.zones.map(z => z.zoneId),
    };
  }

  async createTransporteur(data: CreateTransporteurDto) {
    const { deliveryZones, ...transporteurData } = data;

    const created = await this.prisma.deliveryTransporteur.create({
      data: transporteurData,
    });

    // Create delivery zones if provided
    if (deliveryZones && deliveryZones.length > 0) {
      await this.prisma.deliveryTransporteurZone.createMany({
        data: deliveryZones.map(zoneId => ({
          transporteurId: created.id,
          zoneId,
          zoneType: 'international', // Default, should be determined dynamically
        })),
      });
    }

    return this.getTransporteurById(created.id);
  }

  async updateTransporteur(id: string, data: UpdateTransporteurDto) {
    await this.getTransporteurById(id); // Check if exists

    const { deliveryZones, ...transporteurData } = data;

    await this.prisma.deliveryTransporteur.update({
      where: { id },
      data: transporteurData,
    });

    // Update delivery zones if provided
    if (deliveryZones) {
      // Delete old zones
      await this.prisma.deliveryTransporteurZone.deleteMany({
        where: { transporteurId: id },
      });

      // Create new zones
      if (deliveryZones.length > 0) {
        await this.prisma.deliveryTransporteurZone.createMany({
          data: deliveryZones.map(zoneId => ({
            transporteurId: id,
            zoneId,
            zoneType: 'international', // Default, should be determined dynamically
          })),
        });
      }
    }

    return this.getTransporteurById(id);
  }

  async deleteTransporteur(id: string) {
    await this.getTransporteurById(id); // Check if exists

    await this.prisma.deliveryTransporteur.delete({
      where: { id },
    });
  }

  async toggleTransporteurStatus(id: string) {
    const transporteur = await this.getTransporteurById(id);

    return this.prisma.deliveryTransporteur.update({
      where: { id },
      data: {
        status: transporteur.status === 'active' ? 'inactive' : 'active',
      },
    });
  }

  // ========================================
  // ZONE TARIFS
  // ========================================

  async getZoneTarifs() {
    const tarifs = await this.prisma.deliveryZoneTarif.findMany({
      include: {
        internationalZone: {
          include: {
            countries: true,
          },
        },
        transporteur: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tarifs.map(tarif => ({
      ...tarif,
      countries: tarif.internationalZone?.countries.map(c => c.country) || [],
      transporteurLogo: tarif.transporteur?.logoUrl,
    }));
  }

  async getZoneTarifById(id: string) {
    const tarif = await this.prisma.deliveryZoneTarif.findUnique({
      where: { id },
      include: {
        internationalZone: {
          include: {
            countries: true,
          },
        },
        transporteur: true,
      },
    });

    if (!tarif) {
      throw new NotFoundException(`Zone tarif with ID ${id} not found`);
    }

    return {
      ...tarif,
      countries: tarif.internationalZone?.countries.map(c => c.country) || [],
      transporteurLogo: tarif.transporteur?.logoUrl,
    };
  }

  async createZoneTarif(data: CreateZoneTarifDto) {
    return this.prisma.deliveryZoneTarif.create({
      data: {
        ...data,
        prixTransporteur: new Decimal(data.prixTransporteur),
        prixStandardInternational: new Decimal(data.prixStandardInternational),
      },
    });
  }

  async updateZoneTarif(id: string, data: UpdateZoneTarifDto) {
    await this.getZoneTarifById(id); // Check if exists

    const updateData: any = { ...data };
    if (data.prixTransporteur !== undefined) {
      updateData.prixTransporteur = new Decimal(data.prixTransporteur);
    }
    if (data.prixStandardInternational !== undefined) {
      updateData.prixStandardInternational = new Decimal(data.prixStandardInternational);
    }

    return this.prisma.deliveryZoneTarif.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteZoneTarif(id: string) {
    await this.getZoneTarifById(id); // Check if exists

    await this.prisma.deliveryZoneTarif.delete({
      where: { id },
    });
  }

  async toggleZoneTarifStatus(id: string) {
    const tarif = await this.getZoneTarifById(id);

    return this.prisma.deliveryZoneTarif.update({
      where: { id },
      data: {
        status: tarif.status === 'active' ? 'inactive' : 'active',
      },
    });
  }

  // ========================================
  // CALCUL DE FRAIS DE LIVRAISON
  // ========================================

  async calculateDeliveryFee(
    cityId?: string,
    regionId?: string,
    internationalZoneId?: string,
  ): Promise<{ fee: number; deliveryTime: string }> {
    // Validate that only one parameter is provided
    const providedParams = [cityId, regionId, internationalZoneId].filter(Boolean);
    if (providedParams.length === 0) {
      throw new BadRequestException('At least one parameter (cityId, regionId, or internationalZoneId) must be provided');
    }
    if (providedParams.length > 1) {
      throw new BadRequestException('Only one parameter (cityId, regionId, or internationalZoneId) can be provided');
    }

    if (cityId) {
      const city = await this.getCityById(cityId);
      const fee = Number(city.price);
      let deliveryTime = 'Standard';

      if (city.deliveryTimeMin && city.deliveryTimeMax && city.deliveryTimeUnit) {
        deliveryTime = `${city.deliveryTimeMin}-${city.deliveryTimeMax} ${city.deliveryTimeUnit}`;
      }

      return { fee, deliveryTime };
    }

    if (regionId) {
      const region = await this.getRegionById(regionId);
      const fee = Number(region.price);
      const deliveryTime = `${region.deliveryTimeMin}-${region.deliveryTimeMax} ${region.deliveryTimeUnit}`;

      return { fee, deliveryTime };
    }

    if (internationalZoneId) {
      const zone = await this.getInternationalZoneById(internationalZoneId);
      const fee = Number(zone.price);
      const deliveryTime = `${zone.deliveryTimeMin}-${zone.deliveryTimeMax} jours`;

      return { fee, deliveryTime };
    }

    throw new BadRequestException('Invalid parameters');
  }

  // ========================================
  // TRANSPORTEURS PAR ZONE
  // ========================================

  async getTransporteursByZone(
    cityId?: string,
    regionId?: string,
    internationalZoneId?: string,
  ): Promise<any[]> {
    // Validate that only one parameter is provided
    const providedParams = [cityId, regionId, internationalZoneId].filter(Boolean);
    if (providedParams.length === 0) {
      throw new BadRequestException('At least one parameter (cityId, regionId, or internationalZoneId) must be provided');
    }
    if (providedParams.length > 1) {
      throw new BadRequestException('Only one parameter (cityId, regionId, or internationalZoneId) can be provided');
    }

    let zoneType: string;
    let zoneId: string;

    if (cityId) {
      zoneType = 'city';
      zoneId = cityId;

      // Vérifier que la ville existe
      await this.getCityById(cityId);

      // Récupérer les tarifs pour cette ville
      const tarifs = await this.prisma.deliveryZoneTarif.findMany({
        where: {
          zoneId: cityId,
          status: 'active',
          transporteur: {
            status: 'active'
          }
        },
        include: {
          transporteur: true,
          internationalZone: false // Pas nécessaire pour les villes
        },
        orderBy: {
          prixTransporteur: 'asc' // Trier par prix croissant
        }
      });

      return tarifs.map(tarif => ({
        transporteur: {
          id: tarif.transporteur.id,
          name: tarif.transporteur.name,
          logoUrl: tarif.transporteur.logoUrl,
          status: tarif.transporteur.status
        },
        tarif: {
          id: tarif.id,
          prixTransporteur: Number(tarif.prixTransporteur),
          delaiLivraisonMin: tarif.delaiLivraisonMin,
          delaiLivraisonMax: tarif.delaiLivraisonMax,
          deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`
        },
        deliveryFee: Number(tarif.prixTransporteur),
        deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`,
        zoneType: 'city',
        zoneId: cityId
      }));

    } else if (regionId) {
      zoneType = 'region';
      zoneId = regionId;

      // Vérifier que la région existe
      await this.getRegionById(regionId);

      // Récupérer les tarifs pour cette région
      const tarifs = await this.prisma.deliveryZoneTarif.findMany({
        where: {
          zoneId: regionId,
          status: 'active',
          transporteur: {
            status: 'active'
          }
        },
        include: {
          transporteur: true,
          internationalZone: false // Pas nécessaire pour les régions
        },
        orderBy: {
          prixTransporteur: 'asc'
        }
      });

      return tarifs.map(tarif => ({
        transporteur: {
          id: tarif.transporteur.id,
          name: tarif.transporteur.name,
          logoUrl: tarif.transporteur.logoUrl,
          status: tarif.transporteur.status
        },
        tarif: {
          id: tarif.id,
          prixTransporteur: Number(tarif.prixTransporteur),
          delaiLivraisonMin: tarif.delaiLivraisonMin,
          delaiLivraisonMax: tarif.delaiLivraisonMax,
          deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`
        },
        deliveryFee: Number(tarif.prixTransporteur),
        deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`,
        zoneType: 'region',
        zoneId: regionId
      }));

    } else if (internationalZoneId) {
      zoneType = 'international';
      zoneId = internationalZoneId;

      // Vérifier que la zone internationale existe
      await this.getInternationalZoneById(internationalZoneId);

      // Récupérer les tarifs pour cette zone internationale
      const tarifs = await this.prisma.deliveryZoneTarif.findMany({
        where: {
          zoneId: internationalZoneId,
          status: 'active',
          transporteur: {
            status: 'active'
          }
        },
        include: {
          transporteur: true,
          internationalZone: {
            include: {
              countries: true
            }
          }
        },
        orderBy: {
          prixStandardInternational: 'asc'
        }
      });

      return tarifs.map(tarif => ({
        transporteur: {
          id: tarif.transporteur.id,
          name: tarif.transporteur.name,
          logoUrl: tarif.transporteur.logoUrl,
          status: tarif.transporteur.status
        },
        tarif: {
          id: tarif.id,
          prixTransporteur: Number(tarif.prixTransporteur),
          prixStandardInternational: Number(tarif.prixStandardInternational),
          delaiLivraisonMin: tarif.delaiLivraisonMin,
          delaiLivraisonMax: tarif.delaiLivraisonMax,
          deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`
        },
        deliveryFee: Number(tarif.prixStandardInternational), // Utiliser le prix international
        deliveryTime: `${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`,
        zoneType: 'international',
        zoneId: internationalZoneId,
        countries: tarif.internationalZone?.countries?.map(c => c.country) || []
      }));
    }

    throw new BadRequestException('Invalid parameters');
  }
}
