import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Transaction } from '../schemas/transaction.schema';
import { StripePaymentIntentService } from 'src/provider/stripe/stripe-payment-intent.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import Stripe from 'stripe';
import { Job } from 'src/job/schemas/job.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    private readonly stripeService: StripePaymentIntentService,
  ) {}

  async initiatePayment(payload: CreateTransactionDto & { client: string }) {
    try {
      const { freelancer, client, job, amount } = payload;

      //check if job exist
      const validateJob = await this.jobModel.findOne({
        _id: new mongoose.Types.ObjectId(job),
        createdBy: new mongoose.Types.ObjectId(client),
      });

      if (!validateJob) throw new BadRequestException('Invalid project id');

      const stripePayment =
        await this.stripeService.createPaymentIntent(amount);

      const transaction = await this.transactionModel.create({
        freelancer: new mongoose.Types.ObjectId(freelancer),
        client: new mongoose.Types.ObjectId(client),
        job: new mongoose.Types.ObjectId(job),
        amount,
        channel: 'stripe',
        paymentType: 'card',
        metaData: JSON.stringify(stripePayment),
        status: 'pending',
        transactionId: stripePayment.id,
      });

      return {
        clientSecret: stripePayment.client_secret,
        paymentIntentId: stripePayment.id,
        transaction,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async verifyPayment(paymentIntentId: string) {
    try {
      const payment =
        await this.stripeService.verifyPaymentIntent(paymentIntentId);

      const validateTransaction = await this.transactionModel.findOne({
        transactionId: paymentIntentId,
        status: 'pending',
      });

      if (!validateTransaction)
        throw new BadRequestException(
          'Like duplicate payment or invalid payment',
        );

      const updated = await this.transactionModel.findOneAndUpdate(
        { transactionId: paymentIntentId },
        {
          status: payment.status === 'succeeded' ? 'confirmed' : 'failed',
        },
        { new: true },
      );

      return updated;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async stripeWebhook(payload: Buffer | any, signature?: string) {
    try {
      let event: Stripe.Event;

      // If payload is still a Buffer + signature => verify with Stripe
      if (Buffer.isBuffer(payload) && signature) {
        event = this.stripeService.constructWebhookEvent(payload, signature);
      } else {
        // Otherwise, assume payload is already parsed (like your log shows)
        event = payload as Stripe.Event;
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await this.transactionModel.findOneAndUpdate(
            { transactionId: paymentIntent.id },
            { status: 'paid' },
            { new: true },
          );
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await this.transactionModel.findOneAndUpdate(
            { transactionId: paymentIntent.id },
            { status: 'failed' },
            { new: true },
          );
          break;
        }

        case 'charge.succeeded': {
          const charge = event.data.object as Stripe.Charge;

          await this.transactionModel.findOneAndUpdate(
            { transactionId: charge.payment_intent ?? charge.id },
            { status: 'paid' },
            { new: true },
          );
          break;
        }

        case 'charge.failed': {
          const charge = event.data.object as Stripe.Charge;

          await this.transactionModel.findOneAndUpdate(
            { transactionId: charge.payment_intent ?? charge.id },
            { status: 'failed' },
            { new: true },
          );
          break;
        }

        default:
          console.log(`⚠️ Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('❌ Stripe webhook handling failed:', error.message);
      throw new HttpException('Invalid Stripe Webhook', 400);
    }
  }

  async findAll(
    query: PaginationDto & { payoutStatus?: string; search?: string },
    userId: string,
    accountType: string,
  ) {
    try {
      const { search, page = 1, limit = 10, payoutStatus } = query;
      const skip = (page - 1) * limit;

      const filter: any = {};

      if (accountType === 'client')
        filter.client = new mongoose.Types.ObjectId(userId);
      if (accountType === 'freelancer')
        filter.client = new mongoose.Types.ObjectId(userId);

      if (payoutStatus) {
        filter.payoutStatus = payoutStatus;
      }

      if (search) {
        filter.$or.push(
          { paymentType: { $regex: search, $options: 'i' } },
          { payoutStatus: { $regex: search, $options: 'i' } },
        );
      }

      const transactions = await this.transactionModel
        .find(filter)
        .populate({
          path: 'client',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({
          path: 'freelancer',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({ path: 'job', model: 'Job' })
        .skip(skip)
        .limit(limit);

      const total = await this.transactionModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  //get escrow or pendng payment for client
  async totalEscrow(userId: string): Promise<{ escrowBalance: number }> {
    try {
      const result = await this.transactionModel.aggregate([
        {
          $match: {
            client: new mongoose.Types.ObjectId(userId),
            payoutStatus: 'processing',
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const escrowBalance = result[0]?.total || 0;
      return { escrowBalance };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }
}
