import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsMongoId, IsNumber } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    example: '662aa983714edbe3f503616c',
    description: 'id of the freelancer',
  })
  @IsString()
  @IsMongoId()
  freelancer: string;

  @ApiProperty({
    example: '662aa983714edbe3f503616c',
    description: 'id of the job',
  })
  @IsString()
  @IsMongoId()
  job: string;

  @ApiProperty({
    example: 700,
    description: 'amount intended to pay',
    type: Number,
  })
  @IsNumber()
  amount: number;
}
