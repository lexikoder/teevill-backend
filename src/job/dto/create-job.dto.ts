import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'AI Engineer', description: 'title of job ' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'details of the job' })
  @IsString()
  description: string;

  @ApiProperty({ example: ['first response', 'second response'] })
  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];

  @ApiProperty({
    example: '2 years experience',
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Intern'],
    description: 'Entry Level',
  })
  @IsString()
  experience: string;

  @ApiProperty({
    example: 'all-types',
    enum: ['full-time', 'part-time', 'contract', 'all-types'],
  })
  @IsString()
  jobType: string;

  @ApiProperty({
    example: 'must be good a Artificial intelligence',
  })
  @IsString()
  skill: string;

  @ApiProperty({
    example: 'hourly',
    enum: ['hourly', 'daily', 'monthly', 'fixed'],
  })
  @IsString()
  priceModel: string;

  @ApiPropertyOptional({
    example: 'drafted',
    enum: ['pending', 'review', 'approved', 'open', 'closed', 'drafted'],
  })
  @IsOptional()
  @IsString()
  status: string;

  @ApiProperty({ example: 67 })
  @IsOptional()
  @IsNumber()
  budget: number;
}
