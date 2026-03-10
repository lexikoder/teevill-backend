import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  UnauthorizedException,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { successResponse } from 'src/config/response';
import { WithdrawalService } from '../services/withdrawal.service';
import {
  ApprovalStatausDto,
  CreateWithdrawalDto,
} from '../dto/create-withdrawal.dto';
import { WithdrawalApprovalStatus } from '../enum/withdrawal.enum';

@ApiTags('Withdrawal and payment request')
@Controller('api/v1/withdrawal')
@ApiBearerAuth()
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post('wallet')
  @ApiOperation({ summary: 'Request withdrawal or payment request' })
  @ApiBody({ type: CreateWithdrawalDto })
  @ApiResponse({ status: 200, description: 'Withdrawal request successful' })
  @ApiResponse({ status: 400, description: 'Withdrawal request unsuccessful' })
  async initiate(
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @Req() req: any,
  ) {
    const freelancerId = req.user?._id;
    const result = await this.withdrawalService.requestWithdrawal({
      freelancerId,
      ...createWithdrawalDto,
    });
    return successResponse({
      message: 'Withdrawal request successful',
      code: 200,
      status: 'success',
      data: result,
    });
  }

  ///fetch payment request for freelancer
  @Get()
  @ApiOperation({
    summary:
      'Get all payment requests and withdrawal history for freelancer with search, pagination, status, and approvalStatus filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({
    name: 'approvalStatus',
    required: false,
    type: String,
    enum: WithdrawalApprovalStatus,
  })
  @ApiResponse({ status: 200, description: 'Withdrawal Lists' })
  @ApiResponse({ status: 400, description: 'Error fetching withdrawal lists' })
  async findAllFreelancerWithdrawal(
    @Query()
    query: PaginationDto & {
      status?: string;
      approvalStatus?: WithdrawalApprovalStatus;
    },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const data = await this.withdrawalService.findFreelancerWithdrawal(
      query,
      userId,
    );
    return successResponse({
      message: 'Withdrawal Lists',
      code: 200,
      status: 'success',
      data,
    });
  }

  ///fetch payment request for freelancer
  @Get('client')
  @ApiOperation({
    summary:
      'Get all payment requests and withdrawal history for client with search, pagination, status, and approvalStatus filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({
    name: 'approvalStatus',
    required: false,
    type: String,
    enum: WithdrawalApprovalStatus,
  })
  @ApiResponse({ status: 200, description: 'Withdrawal Lists' })
  @ApiResponse({ status: 400, description: 'Error fetching withdrawal lists' })
  async fetchClientWithdrawalRequest(
    @Query()
    query: PaginationDto & {
      status?: string;
      approvalStatus?: WithdrawalApprovalStatus;
    },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const data = await this.withdrawalService.findClientWithdrawal(
      query,
      userId,
    );
    return successResponse({
      message: 'Withdrawal Lists',
      code: 200,
      status: 'success',
      data,
    });
  }

  @Put(':id/approval')
  @ApiOperation({
    summary: 'Update withdrawal approval status (approved/rejected)',
  })
  @ApiBody({ type: ApprovalStatausDto })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async updateApprovalStatus(
    @Param('id') withdrawalId: string,
    @Body('status') status: WithdrawalApprovalStatus,
  ) {
    const result = await this.withdrawalService.updateApprovalStatus(
      withdrawalId,
      status,
    );
    return successResponse({
      message: `Withdrawal request ${status}`,
      code: 200,
      status: 'success',
      data: result,
    });
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all withrawal with search, pagination, and status filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Withrawal Lists' })
  @ApiResponse({ status: 400, description: 'Error fetching withdrawal lists' })
  async findAll(@Query() query: PaginationDto & { status?: string }) {
    const data = await this.withdrawalService.findAllWithdrawal(query);
    return successResponse({
      message: 'Withrawal Lists',
      code: 200,
      status: 'success',
      data,
    });
  }
}
