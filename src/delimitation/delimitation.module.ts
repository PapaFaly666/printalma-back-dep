import { Module } from '@nestjs/common';
import { DelimitationController } from './delimitation.controller';
import { DelimitationService } from './delimitation.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DelimitationController],
  providers: [DelimitationService, PrismaService],
  exports: [DelimitationService],
})
export class DelimitationModule {} 