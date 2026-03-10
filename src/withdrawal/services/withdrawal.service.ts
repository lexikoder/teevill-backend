import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { Withdrawal } from '../schemas/withdrawal.schema';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { User } from 'src/user/schemas/user.schema';
import {
  WithdrawalApprovalStatus,
  WithdrawalStatus,
} from '../enum/withdrawal.enum';
import { AlphaNumeric } from 'src/core/common/utils/authentication';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/services/notification.service';
import { Job, JobDocument } from 'src/job/schemas/job.schema';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  async requestWithdrawal(
    payload: CreateWithdrawalDto & { freelancerId: string },
  ) {
    try {
      const { freelancerId, job } = payload;

      const validateJob = await this.jobModel.findOne({
        _id: new mongoose.Types.ObjectId(job),
      });

      if (!validateJob) throw new BadRequestException('Invalid job id');

      //validate freelancer
      const freelancer = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(freelancerId),
      });

      if (!freelancer) throw new BadRequestException('Invalid freelancer id');

      let transactionId;
      let validateTransactionId;

      do {
        transactionId = `TRX-${AlphaNumeric(5)}`;
        validateTransactionId = await this.withdrawalModel.findOne({
          transactionId,
        });
      } while (validateTransactionId);

      //create withdrawal
      const withdrawal = await this.withdrawalModel.create({
        freelancer: new mongoose.Types.ObjectId(freelancerId),
        job: new mongoose.Types.ObjectId(job),
        status: WithdrawalStatus.review,
        transactionId,
        ...payload,
      });

      if (!withdrawal)
        throw new BadRequestException('Unable to complete withdrawal process');

      try {
        await this.mailService.sendMailNotification(
          freelancer.email,
          'Teevil: Withdrawal Request',
          { name: freelancer.firstName, amount: payload.amount },
          'withrawalRequest',
        );
        await this.notificationService.create({
          title: 'Withdrawal ',
          content: `Congratulations!!! your withdrawal request for ${payload.amount} is processing `,
          notificationType: 'Withdrawal',
          userType: 'user',
          user: freelancerId.toString(),
        });
      } catch (error) {
        console.log('mail error', error);
      }

      return withdrawal;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async findFreelancerWithdrawal(
    query: PaginationDto & {
      status?: string;
      approvalStatus?: WithdrawalApprovalStatus;
    },
    userId: string,
  ) {
    try {
      const { search, page = 1, limit = 10, status, approvalStatus } = query;
      const skip = (page - 1) * limit;

      const filter: any = {
        $or: [{ client: userId }, { freelancer: userId }],
      };

      if (status) {
        filter.status = status;
      }

      if (approvalStatus) {
        filter.approvalStatus = approvalStatus;
      }

      if (search) {
        filter.$or.push(
          { transactionId: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        );
      }

      const withdrawals = await this.withdrawalModel
        .find(filter)
        .populate({
          path: 'freelancer',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({
          path: 'job',
          model: 'Job',
          populate: {
            path: 'createdBy',
            model: 'User',
            select: 'firstName lastName profileImage email',
          },
        })
        .skip(skip)
        .limit(limit);

      const total = await this.withdrawalModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: withdrawals,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  //fetch payment request
  async findClientWithdrawal(
    query: PaginationDto & {
      status?: string;
      approvalStatus?: WithdrawalApprovalStatus;
    },
    userId: string,
  ) {
    try {
      const { search, page = 1, limit = 10, status, approvalStatus } = query;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};
      if (status) filter.status = status;
      if (approvalStatus) filter.approvalStatus = approvalStatus;

      if (search) {
        filter.$or = [
          { transactionId: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ];
      }

      // Get withdrawals with populated job + createdBy
      const withdrawals = await this.withdrawalModel
        .find(filter)
        .populate({
          path: 'freelancer',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({
          path: 'job',
          model: 'Job',
        })
        .skip(skip)
        .limit(limit);

      // Filter results where job.createdBy === logged-in user
      const filteredWithdrawals = withdrawals.filter((w) => {
        const job = w.job as unknown as JobDocument;
        return job?.createdBy?.toString() === userId.toString();
      });

      return {
        total: filteredWithdrawals.length,
        page,
        limit,
        totalPages: Math.ceil(filteredWithdrawals.length / limit),
        data: filteredWithdrawals,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async updateApprovalStatus(
    withdrawalId: string,
    status: WithdrawalApprovalStatus,
  ) {
    try {
      if (
        ![
          WithdrawalApprovalStatus.approved,
          WithdrawalApprovalStatus.rejected,
        ].includes(status)
      ) {
        throw new BadRequestException('Invalid approval status');
      }

      const withdrawal = await this.withdrawalModel.findById(withdrawalId);
      if (!withdrawal) {
        throw new BadRequestException('Withdrawal not found');
      }

      withdrawal.approvalStatus = status;
      await withdrawal.save();

      try {
        await this.notificationService.create({
          title: 'Withdrawal Approval Update',
          content: `Your withdrawal request of ${withdrawal.amount} has been ${status}`,
          notificationType: 'Withdrawal',
          userType: 'user',
          user: withdrawal.freelancer.toString(),
        });
      } catch (err) {
        console.log('Notification error', err);
      }

      return withdrawal;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async findAllWithdrawal(query: PaginationDto & { status?: string }) {
    try {
      const { search, page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { paymentType: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ];
      }

      const withdrawal = await this.withdrawalModel
        .find(filter)
        .populate({
          path: 'freelancer',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({
          path: 'job',
          model: 'Job',
        })
        .skip(skip)
        .limit(limit);

      const total = await this.withdrawalModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: withdrawal,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }
}
