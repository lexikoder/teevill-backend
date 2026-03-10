import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Put,
  HttpCode,
  Query,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import { successResponse } from 'src/config/response';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateTaskDto, UpdateSubTaskDto } from '../dto/create-project.dto';
import { UpdateTaskDto } from '../dto/update-project.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';

@ApiTags('Freelancer Tasks')
@ApiBearerAuth()
@Controller('api/v1/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new task with optional subtasks' })
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
  })
  @UseInterceptors(FilesInterceptor('files', 9))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Complete documentation' },
        content: { type: 'string', example: 'Task details' },
        priority: { type: 'string', enum: ['high', 'medium', 'low', 'casual'] },
        section: { type: 'string', example: '613b6c3a5b41a2f123456789' },
        assignedTo: { type: 'array', items: { type: 'string' } },
        project: { type: 'string', example: '613b6c3a5b41a2f123456789' },
        dueDate: { type: 'string', format: 'date-time' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of subtasks to be created with the task',
          example: ['Subtask 1', 'Subtask 2'],
        },
      },
    },
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const data = await this.taskService.create(createTaskDto, files);
    return successResponse({
      message: 'Task successfully created',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  @Put('sub-task')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateSubTaskDto })
  @ApiOperation({ summary: 'Delete a subtask by ID' })
  @ApiResponse({ status: 200, description: 'Subtask updated successfully' })
  @ApiResponse({ status: 404, description: 'Unable to update sub task' })
  async updateSubTask(@Body() updateSubTaskDto: UpdateSubTaskDto) {
    const updated = await this.taskService.updateSubTask(updateSubTaskDto);
    return {
      status: 'success',
      message: 'Subtask updated successfully',
      data: updated,
    };
  }

  @Delete('sub-task/:id')
  @ApiOperation({ summary: 'Delete a subtask by ID' })
  @ApiResponse({ status: 200, description: 'Subtask successfully deleted' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async deleteSubTask(@Param('id') subTaskId: string) {
    const result = await this.taskService.deleteSubTask(subTaskId);
    return successResponse({
      message: 'Subtask deleted',
      code: HttpStatus.OK,
      status: 'success',
      data: result,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all tasks' })
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
    example: 'project name',
    description: 'Search query for project title',
  })
  @ApiQuery({
    name: 'sectionId',
    required: false,
    type: String,
    example: '669a6197c3e587bd6e4a63ef',
    description: 'ID of section',
  })
  @ApiQuery({
    name: 'taskId',
    required: false,
    type: String,
    example: '669a6197c3e587bd6e4a63ef',
    description: 'ID of task',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['todo', 'in-progress', 'completed'], // Example statuses; adjust to your needs
    description: 'Filter tasks by status',
  })
  async fetchAll(
    @Query()
    query: PaginationDto,
    @Query('sectionId') sectionId?: string,
    @Query('taskId') taskId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.taskService.fetchAll(
      query,
      sectionId,
      taskId,
      status,
    );
    return successResponse({
      message: 'Tasks retrieved',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @UseInterceptors(FilesInterceptor('files', 9))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const data = await this.taskService.update(id, updateTaskDto, files);
    return successResponse({
      message: 'Task updated',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async delete(@Param('id') id: string) {
    const data = await this.taskService.delete(id);
    return successResponse({
      message: 'Task deleted',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}
