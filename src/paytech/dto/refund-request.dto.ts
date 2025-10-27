import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for PayTech refund request
 * Based on official PayTech documentation
 */
export class RefundRequestDto {
  @ApiProperty({ description: 'Reference of the command to refund' })
  @IsNotEmpty()
  @IsString()
  ref_command: string;
}
