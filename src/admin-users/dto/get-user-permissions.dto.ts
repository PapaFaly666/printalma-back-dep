import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionsResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  module: string;
}

export class UserWithPermissionsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [UserPermissionsResponseDto] })
  permissions: UserPermissionsResponseDto[];

  @ApiProperty({ required: false })
  role?: {
    id: number;
    name: string;
    slug: string;
  };
}
