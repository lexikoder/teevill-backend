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
import { ProjectService } from '../services/project.service';
import {
  AcceptProjectDto,
  CreateInviteDto,
  CreateProjectDto,
} from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';

@ApiTags('Freelancer & Client Project')
@ApiBearerAuth()
@Controller('api/v1/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProjectDto })
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createProject(
    @Req() req: any,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const data = await this.projectService.createProject({
      ...createProjectDto,
      createdBy: userId,
    });

    return successResponse({
      message: 'Project created successfully',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProjectDto })
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Req() req: any, @Body() createProjectDto: CreateProjectDto) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const data = await this.projectService.createProject({
      ...createProjectDto,
      createdBy: userId,
    });

    return successResponse({
      message: 'Project created successfully',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  //add invite or collaborator
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an invite for a project' })
  @ApiResponse({ status: 201, description: 'Invite created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        projectId: { type: 'string', example: '64f7a2b9a7e5b2c5d7a9c6f1' },
        sections: {
          type: 'array',
          items: { type: 'string' },
          example: ['64f7a2b9a7e5b2c5d7a9c6f2', '64f7a2b9a7e5b2c5d7a9c6f3'],
        },
      },
      required: ['email', 'projectId', 'sections'],
    },
  })
  async createInvite(
    @Body() createInviteDto: CreateInviteDto,
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    await this.projectService.createInvite(createInviteDto, userId);
    return successResponse({
      message: 'Invite sent',
      code: HttpStatus.CREATED,
      status: 'success',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with search and pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
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
    example: 'input search key for project',
    description: 'Search query for project title',
  })
  @ApiQuery({
    name: 'projectType',
    required: false,
    type: String,
    enum: ['shared', 'personal', 'contract', 'client'],
    description: 'Filter by project type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['in-progress', 'review', 'completed', 'pending', 'suspended'],
    description: 'Filter by project status',
  })
  async findAll(
    @Query()
    query: PaginationDto & { projectType: string } & { status: string },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const { page, limit, search, projectType, status } = query;
    const data = await this.projectService.findAll(
      { page, limit, search, projectType, status },
      userId,
    );

    return successResponse({
      message: 'Projects retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.projectService.findOne(id);
    return successResponse({
      message: 'Project retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(@Param('id') id: string, @Body() updateData: UpdateProjectDto) {
    const data = await this.projectService.update(id, updateData);
    return successResponse({
      message: 'Project updated successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async delete(@Param('id') id: string) {
    const data = await this.projectService.delete(id);
    return successResponse({
      message: 'Project deleted successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('accept/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AcceptProjectDto })
  @ApiOperation({ summary: 'Accept or reject project invite' })
  @ApiResponse({ status: 200, description: 'Project joined successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async acceptProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body() accepteProjectDto: AcceptProjectDto,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const data = await this.projectService.acceptProject(
      projectId,
      userId,
      accepteProjectDto,
    );
    return successResponse({
      message: 'successful',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('collaborators/:id')
  @ApiOperation({
    summary:
      'Fetch all collaborators or users added to a project with project id',
  })
  @ApiResponse({ status: 200, description: 'List of collaborators' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async projectUsers(@Param('id') id: string) {
    const data = await this.projectService.getProjectUsers(id);
    return successResponse({
      message: 'List of collaborators',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}
