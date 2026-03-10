import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';

export class CreateProposalDto {
  @ApiProperty({
    example: 'Cover Letter',
    description: 'cover letter header  or title',
  })
  @IsString()
  title: string;

  @ApiProperty({ description: 'content or details of the cofer letter' })
  @IsString()
  body: string;

  @ApiProperty({
    example: '4 to 6 weeks',
    description: 'time line for deliver the project',
  })
  @IsString()
  timeLine: string;

  @ApiProperty({
    example: '20 dollars per hour',
  })
  @IsString()
  bidAmount: string;

  @ApiProperty({
    example: '613b6c3a5b41a2f123456789',
    description: 'Job id',
    type: String,
  })
  @IsString()
  @IsMongoId()
  job: string;
}

export class ProposalStatusDto {
  @ApiProperty({
    example: 'accepted',
    description: 'update propsal status e.g accepted or rejected',
    enum: ['accepted', 'rejected'],
  })
  @IsString()
  status: string;
}
