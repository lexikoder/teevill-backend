import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDate,
  IsArray,
  IsEmail,
  IsMongoId,
  ArrayNotEmpty,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { projectType } from '../enumAndTypes/project.enum';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  projectType: projectType;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  section: string[];
}

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  @IsMongoId()
  projectId: string;
}

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsMongoId()
  projectId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  sections: string[];
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'Complete documentation',
    description: 'Title of the task',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Detailed description of the task', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    example: 'medium',
    enum: ['high', 'medium', 'low', 'casual'],
    default: 'casual',
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low', 'casual'])
  priority?: 'high' | 'medium' | 'low' | 'casual';

  @ApiPropertyOptional({
    example: 'todo',
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
  })
  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'completed'])
  status?: 'todo' | 'in-progress' | 'completed';

  @ApiProperty({
    example: '613b6c3a5b41a2f123456789',
    description: 'Section ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  section: string;

  @ApiProperty({
    example: ['613b6c3a5b41a2f123456789'],
    description: 'Assigned User IDs',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value); // if passed as '["id1","id2"]'
      } catch {
        return value.split(','); // if passed as 'id1,id2'
      }
    }
    return value;
  })
  assignedTo: string[];

  @ApiProperty({
    example: '613b6c3a5b41a2f123456789',
    description: 'Project ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  project: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2024-12-31',
    description: 'Due date of the task',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({
    type: [String],
    description: 'List of subtasks to be created with the task',
    required: false,
    example: ['Subtask 1', 'Subtask 2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value); // if passed as '["Subtask 1","Subtask 2"]'
      } catch {
        return value.split(','); // if passed as 'Subtask 1,Subtask 2'
      }
    }
    return value;
  })
  tasks?: string[];
}

export class UpdateSubTaskDto {
  @ApiProperty({
    type: String,
    description: 'subTitle of subtask',
    example: 'Task 1',
  })
  @IsOptional()
  @IsString()
  subTitle: string;

  @ApiProperty({ type: Boolean, description: 'false or true', example: true })
  @IsOptional()
  @IsBoolean()
  status: boolean;

  @ApiProperty({
    example: ['613b6c3a5b41a2f123456789'],
    description: 'Id of task',
    type: String,
  })
  @IsString()
  @IsMongoId()
  taskId: string;

  @ApiProperty({
    example: ['613b6c3a5b41a2f123456789'],
    description: 'Id of sub task',
    type: String,
  })
  @IsString()
  @IsMongoId()
  subTaskId: string;
}

export class AcceptProjectDto {
  @ApiProperty({
    description: `accept or reject a project based on invitation, e.g "accepted" or "rejected`,
    example: 'rejected',
  })
  @IsString()
  status: 'accepted' | 'rejected';
}
