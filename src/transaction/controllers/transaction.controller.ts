import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { successResponse } from 'src/config/response';

@ApiTags('Transaction and Payment history')
@Controller('api/v1/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiBearerAuth()
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a Stripe Payment' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 200, description: 'Stripe payment initiated' })
  async initiate(
    @Body() transactionDto: CreateTransactionDto,
    @Req() req: any,
  ) {
    const client = req.user?._id;
    const result = await this.transactionService.initiatePayment({
      client,
      ...transactionDto,
    });
    return successResponse({
      message: 'Stripe payment initiated',
      code: 200,
      status: 'success',
      data: result,
    });
  }

  @ApiBearerAuth()
  @Get('verify/:paymentIntentId')
  @ApiOperation({ summary: 'Verify Stripe Payment by PaymentIntent ID' })
  async verify(@Param('paymentIntentId') paymentIntentId: string) {
    const result = await this.transactionService.verifyPayment(paymentIntentId);
    return successResponse({
      message: 'Stripe payment verification successful',
      code: 200,
      status: 'success',
      data: result,
    });
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary:
      'Get all transactions or payment history with search, pagination, and status filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'payoutStatus',
    required: false,
    type: String,
    enum: ['processing', 'paid'],
  })
  async findAll(
    @Query() query: PaginationDto & { payoutStatus?: string },
    @Req() req: any,
  ) {
    const userId = req.user?._id;
    const accountType = req.user?.accountType;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    const data = await this.transactionService.findAll(
      query,
      userId,
      accountType,
    );
    return successResponse({
      message: 'Transaction lists',
      code: 200,
      status: 'success',
      data,
    });
  }

  //get total escrow balance for client
  @ApiBearerAuth()
  @Get('escrow')
  @ApiOperation({
    summary: 'Get total balance for clients escrow',
  })
  async totalEscrow(@Req() req: any) {
    const userId = req.user?._id;
    const accountType = req.user?.accountType;
    if (!userId && accountType !== 'client')
      throw new UnauthorizedException('Only client can access this route');
    const data = await this.transactionService.totalEscrow(userId);
    return successResponse({
      message: 'Escrow balence fetched',
      code: 200,
      status: 'success',
      data,
    });
  }

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody: Buffer = req.body;
    return this.transactionService.stripeWebhook(rawBody, signature);
  }
}
