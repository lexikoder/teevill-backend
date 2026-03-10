import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    example: 700,
    description: 'amount intended to withdrawal',
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'bank-transfer',
  })
  @IsString()
  method: string;

  @ApiProperty({
    example: '662aa983714edbe3f503616c',
    description: 'id of the job',
  })
  @IsString()
  @IsMongoId()
  job: string;
}

export class ApprovalStatausDto {
  @ApiProperty({
    description: `approval status is either "accepted or "rejected"`,
  })
  @IsString()
  status: string;
}
