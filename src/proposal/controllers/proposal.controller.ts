import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  Req,
  Get,
  Query,
  Param,
  Put,
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
import { ProposalService } from '../services/proposal.service';
import {
  CreateProposalDto,
  ProposalStatusDto,
} from '../dto/create-proposal.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';

@ApiTags('Freelancer & Client Proposal')
@Controller('api/v1/proposal')
@ApiBearerAuth()
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProposalDto })
  @ApiOperation({ summary: 'Create a proposal' })
  @ApiResponse({ status: 201, description: 'Proposal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Req() req: any, @Body() createProposalDto: CreateProposalDto) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const data = await this.proposalService.createPropsosal({
      ...createProposalDto,
      submittedBy: userId,
    });
    return successResponse({
      message: 'Proposal created successfully',
      code: HttpStatus.CREATED,
      status: 'success',
      data,
    });
  }

  /**freealncers proposal list */
  @Get()
  @ApiOperation({
    summary:
      'Get all proposals by freelancer with search, pagination and status filter. this endpoint is only for freelancer',
  })
  @ApiResponse({ status: 200, description: 'Freelancer proposals list' })
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
    description: 'Search query for proposal',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'pending',
    description:
      'Filter proposals by status (pending, accepted, rejected, under-review)',
  })
  async findAll(
    @Query() query: PaginationDto & { status?: string },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    const accountType = req.user.accountType;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    if (!accountType || accountType !== 'freelancer')
      throw new UnauthorizedException(
        'Only freelancers are allowed to use this endpoint',
      );
    const data = await this.proposalService.findAll(query, userId);
    return successResponse({
      message: 'Freelancer proposals list',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  /**freealncers proposal list */
  @Get('client')
  @ApiOperation({
    summary:
      'Get all proposals by clientwith search, pagination and status filter. This endpoint is only for client',
  })
  @ApiResponse({ status: 200, description: 'Client proposals list' })
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
    description: 'Search query for proposal',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'pending',
    description:
      'Filter proposals by status (pending, accepted, rejected, under-review)',
  })
  async findAllClientProposal(
    @Query() query: PaginationDto & { status?: string },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    const accountType = req.user.accountType;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    if (!accountType || accountType !== 'client')
      throw new UnauthorizedException(
        'Only clients are allowed to use this endpoint',
      );
    const data = await this.proposalService.findAllProposalsForClients(
      query,
      userId,
    );
    return successResponse({
      message: 'Client proposals list',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.proposalService.findOne(id);
    return successResponse({
      message: 'Proposal retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put(':id')
  @ApiBody({ type: ProposalStatusDto })
  @ApiOperation({
    summary: 'Update proposal status e.g "accepted", "rejected"',
  })
  @ApiResponse({ status: 201, description: 'Proposal Status updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async proposalStatus(
    @Req() req: any,
    @Body() proposalStatusDto: ProposalStatusDto,
    @Param('id') id: string,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const data = await this.proposalService.updateProposal(
      proposalStatusDto,
      id,
    );
    return successResponse({
      message: 'Proposal Status updated',
      code: HttpStatus.ACCEPTED,
      status: 'success',
      data,
    });
  }
}
