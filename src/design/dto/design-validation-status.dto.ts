import { ApiProperty } from '@nestjs/swagger';

export class DesignValidationStatusDto {
  @ApiProperty({ example: 117 })
  id: number;

  @ApiProperty({ example: 'Logo Corporate' })
  name: string;

  @ApiProperty({ example: true })
  isValidated: boolean;

  @ApiProperty({ example: false })
  isPending: boolean;

  @ApiProperty({ example: false })
  isDraft: boolean;

  @ApiProperty({ example: null, nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ example: '2025-06-15T10:42:00Z', nullable: true })
  validatedAt: string | null;
}

export class GetDesignValidationStatusResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DesignValidationStatusDto })
  data: DesignValidationStatusDto;
} 