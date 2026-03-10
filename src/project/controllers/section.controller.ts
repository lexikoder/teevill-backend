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
import { CreateSectionDto } from '../dto/create-project.dto';
import { UpdateSectionDto } from '../dto/update-project.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { SectionService } from '../services/section.service';

@ApiTags('Freelancer Section')
@ApiBearerAuth()
@Controller('api/v1/section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateSectionDto })
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createSectionDto: CreateSectionDto) {
    const data = await this.sectionService.createSection({
      ...createSectionDto,
    });
    return successResponse({
      message: 'Section created successfully',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections with search and pagination' })
  @ApiResponse({ status: 200, description: 'Sections retrieved successfully' })
  @ApiQuery({
    name: 'projectId',
    required: true,
    type: String,
  })
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
    example: 'section name',
    description: 'Search query for project title',
  })
  async findAll(
    @Query() query: PaginationDto,
    @Req() req: any,
    @Query() projectId: string,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const { page, limit, search } = query;
    const data = await this.sectionService.findAll(
      { page, limit, search },
      userId,
      projectId,
    );
    return successResponse({
      message: 'Projects retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiResponse({ status: 200, description: 'Section retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.sectionService.findOne(id);
    return successResponse({
      message: 'Section retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a section by ID' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async update(@Param('id') id: string, @Body() updateData: UpdateSectionDto) {
    const data = await this.sectionService.update(id, updateData);
    return successResponse({
      message: 'Section updated successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section by ID' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async delete(@Param('id') id: string) {
    const data = await this.sectionService.delete(id);
    return successResponse({
      message: 'Section deleted successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}
