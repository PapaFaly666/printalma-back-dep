// categories/category.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PrismaService } from '../prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: createCategoryDto,
        });
    }

    async findAll() {
        return this.prisma.category.findMany();
    }

    async findOne(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                products: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Count products in this category
        const productCount = await this.prisma.product.count({
            where: { 
                categories: {
                    some: {
                        id: id
                    }
                }
            }
        });

        return {
            ...category,
            productCount
        };
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto) {
        // Vérifier si la catégorie existe
        await this.findOne(id);

        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }

    async remove(id: number) {
        // Vérifier si la catégorie existe
        await this.findOne(id);
        
        // Vérifier si des produits sont liés à cette catégorie
        const productsCount = await this.prisma.product.count({
            where: { 
                categories: {
                    some: {
                        id: id
                    }
                }
            }
        });
        
        if (productsCount > 0) {
            throw new BadRequestException(`Impossible de supprimer la catégorie car elle est liée à ${productsCount} produit(s). Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie.`);
        }

        return this.prisma.category.delete({
            where: { id },
        });
    }
}