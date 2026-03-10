import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Job } from 'src/job/schemas/job.schema';
import { Project } from 'src/project/schemas/project.schema';
import { Proposal } from 'src/proposal/schemas/proposal.schema';
import { Transaction } from 'src/transaction/schemas/transaction.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
  ) {}

  /**freealncer dashbaord chart analysis */
  async freelancerDashbaordAnalysis(
    payload: { day?: string; month?: string; year?: string },
    req: any,
  ): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      if (payload?.day) {
        startDate = new Date(payload.day);
        startDate.setHours(0, 0, 0, 0);
      } else if (payload?.month) {
        const [year, month] = payload.month.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
      } else if (payload?.year) {
        const year = parseInt(payload.year);
        startDate = new Date(year, 0, 1);
      } else {
        // default to last 12 months
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const matchQuery: any = {
        createdAt: { $gte: startDate },
        // status: 'completed',
      };

      // Optional: match projects created by current user
      if (req?.user?._id) {
        matchQuery.$or = [
          { createdBy: req.user._id },
          { usersAdded: req.user._id },
        ];
      }
      const proposal = await this.projectModel.aggregate([
        { $match: matchQuery },
        {
          $project: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            status: 1,
          },
        },
        {
          $group: {
            _id: { month: '$month', year: '$year', status: '$status' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
        {
          $addFields: {
            monthName: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id.month', 1] }, then: 'January' },
                  { case: { $eq: ['$_id.month', 2] }, then: 'February' },
                  { case: { $eq: ['$_id.month', 3] }, then: 'March' },
                  { case: { $eq: ['$_id.month', 4] }, then: 'April' },
                  { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                  { case: { $eq: ['$_id.month', 6] }, then: 'June' },
                  { case: { $eq: ['$_id.month', 7] }, then: 'July' },
                  { case: { $eq: ['$_id.month', 8] }, then: 'August' },
                  { case: { $eq: ['$_id.month', 9] }, then: 'September' },
                  { case: { $eq: ['$_id.month', 10] }, then: 'October' },
                  { case: { $eq: ['$_id.month', 11] }, then: 'November' },
                  { case: { $eq: ['$_id.month', 12] }, then: 'December' },
                ],
                default: 'Unknown',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            monthName: '$monthName',
            year: '$_id.year',
            status: '$_id.status',
            count: 1,
          },
        },
      ]);

      return proposal;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  /**freelancer card analysis */
  async freelanncersCards(req: any): Promise<any> {
    try {
      const userId = req?.user?._id;
      if (!userId) throw new UnauthorizedException('Unauthorized');

      const [
        totalProjects,
        totalCompletedProjects,
        totalProposals,
        totalEarnings,
        availableBalance,
        totalWithdrawnAmount,
      ] = await Promise.all([
        this.projectModel.countDocuments({
          $or: [{ createdBy: userId }, { usersAdded: userId }],
        }),
        this.projectModel.countDocuments({
          $or: [{ createdBy: userId }, { usersAdded: userId }],
          status: 'completed',
        }),
        this.proposalModel.countDocuments({ submittedBy: userId }),
        this.transactionModel.aggregate([
          {
            $match: {
              freelancer: userId,
              status: 'paid',
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),
        this.transactionModel.aggregate([
          {
            $match: {
              freelancer: userId,
              status: 'paid',
              payoutStatus: 'processing',
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),
        this.transactionModel.aggregate([
          {
            $match: {
              freelancer: userId,
              status: 'paid',
              payoutStatus: 'paid',
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),
      ]);

      return {
        totalProjects,
        totalCompletedProjects,
        totalAppliedJobs: totalProposals ?? 0,
        totalEarnings:
          totalEarnings.length > 0 ? totalEarnings[0].totalAmount : 0,
        availableBalance:
          availableBalance.length > 0 ? availableBalance[0].totalAmount : 0,
        totalWithdrawnAmount:
          totalWithdrawnAmount.length > 0
            ? totalWithdrawnAmount[0].totalAmount
            : 0,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  /**clients card ananlysis */
  async clientsCards(req: any): Promise<any> {
    try {
      const userId = req?.user?._id;
      if (!userId) throw new UnauthorizedException('Unauthorized');

      const userObjectId = new mongoose.Types.ObjectId(userId);

      const [
        totalJobs,
        totalProposals,
        totalActiveProject,
        totalCompletedProjects,
      ] = await Promise.all([
        // Count Jobs created by user
        this.jobModel.countDocuments({ createdBy: userObjectId }),

        // Count Proposals for Jobs created by user
        (async () => {
          const jobsCreatedByUser = await this.jobModel.find(
            { createdBy: userObjectId },
            { _id: 1 },
          );
          const jobIds = jobsCreatedByUser.map((job) => job._id);

          return this.proposalModel.countDocuments({ jobId: { $in: jobIds } });
        })(),

        // Count Active Projects
        this.projectModel.countDocuments({
          $or: [{ createdBy: userObjectId }, { usersAdded: userObjectId }],
          status: 'in-progress',
        }),

        // Count Completed Projects
        this.projectModel.countDocuments({
          $or: [{ createdBy: userObjectId }, { usersAdded: userObjectId }],
          status: 'completed',
        }),
      ]);

      return {
        totalJobs,
        totalProposals,
        totalActiveProject,
        totalCompletedProjects,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
