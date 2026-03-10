import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  Req,
  Get,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/config/response';
import { JobPaginationDto } from 'src/core/common/pagination/pagination';
import { JobService } from '../services/job.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';

@ApiTags('Job')
@Controller('api/v1/job')
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateJobDto })
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Req() req: any, @Body() createJobDto: CreateJobDto) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const data = await this.jobService.createJob({
      ...createJobDto,
      createdBy: userId,
    });

    return successResponse({
      message: 'Job created successfully',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all jobs with search, pagination, and filters',
  })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'job name',
    description: 'Search query for job title',
  })
  @ApiQuery({
    name: 'jobType',
    required: false,
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'all-types'],
    description: 'Filter by job type',
  })
  @ApiQuery({
    name: 'priceModel',
    required: false,
    type: String,
    enum: ['hourly', 'daily', 'monthly', 'fixed'],
    description: 'Filter by price model',
  })
  @ApiQuery({
    name: 'budgetRange',
    required: false,
    type: String,
    enum: ['10-50', '51-100', '101-500', '501-1000', 'above1000'],
    description: 'Filter by budget range',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['pending', 'review', 'approved', 'open', 'closed', 'drafted'],
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Job list fetched' })
  @ApiResponse({ status: 400, description: 'Error fetching job list' })
  async findAll(@Query() query: JobPaginationDto, @Req() req: any) {
    const userId = req.user?._id;
    const accountType = req.user?.accountType;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const {
      page = 1,
      limit = 100000000,
      search,
      jobType,
      priceModel,
      budgetRange,
    } = query;
    const data = await this.jobService.findAll({
      page,
      limit,
      search,
      jobType,
      priceModel,
      budgetRange,
      userId,
      accountType,
    });

    return successResponse({
      message: 'Job list fetched',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.jobService.findOne(id);
    return successResponse({
      message: 'Job retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a job by ID' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(@Param('id') id: string, @Body() updateData: UpdateJobDto) {
    const data = await this.jobService.update(id, updateData);
    return successResponse({
      message: 'Job updated successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job by ID' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async delete(@Param('id') id: string) {
    const data = await this.jobService.delete(id);
    return successResponse({
      message: 'Job deleted successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}
