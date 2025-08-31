import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ required: false })
  last_login_at: Date | null;
}
