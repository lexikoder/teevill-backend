import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  JobPaginationDto,
  PaginationDto,
} from 'src/core/common/pagination/pagination';
import { MailService } from 'src/core/mail/email';
import { Job } from '../schemas/job.schema';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<Job>,
    private readonly mailService: MailService,
  ) {}

  async createJob(payload: CreateJobDto & { createdBy: string }) {
    const { title, createdBy } = payload;

    try {
      const existingJob = await this.jobModel.findOne({
        createdBy: new mongoose.Types.ObjectId(createdBy),
        status: 'open',
        title,
      });

      if (existingJob) {
        throw new BadRequestException(
          'An open job with a similar title already exists',
        );
      }

      const job = await this.jobModel.create({
        ...payload,
        status: payload.status === 'drafted' ? 'drafted' : 'open',
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      if (!job) {
        throw new BadRequestException('Unable to create the job');
      }

      return job;
    } catch (error) {
      throw new HttpException(
        error?.message || 'Internal server error',
        error?.status || 500,
      );
    }
  }

  async findAll(query: JobPaginationDto) {
    try {
      const {
        search,
        page = 1,
        limit = 100000000,
        jobType,
        priceModel,
        status,
        budgetRange,
        userId,
        accountType,
      } = query;
      const skip = (page - 1) * limit;

      let filter: any = {};

      if (accountType === 'client') {
        filter.createdBy = new mongoose.Types.ObjectId(userId);
      }

      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      if (jobType && jobType !== 'all-types') {
        filter.jobType = jobType;
      }

      if (status) {
        filter.status = status;
      }

      if (priceModel) {
        filter.priceModel = priceModel;
      }

      if (budgetRange) {
        switch (budgetRange) {
          case '10-50':
            filter.budget = { $gte: 10, $lte: 50 };
            break;
          case '51-100':
            filter.budget = { $gte: 51, $lte: 100 };
            break;
          case '101-500':
            filter.budget = { $gte: 101, $lte: 500 };
            break;
          case '501-1000':
            filter.budget = { $gte: 501, $lte: 1000 };
            break;
          case 'above1000':
            filter.budget = { $gte: 1001 };
            break;
          default:
            break;
        }
      }

      const jobs = await this.jobModel
        .find(filter)
        .populate({
          path: 'createdBy',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .skip(skip)
        .limit(limit);

      const total = await this.jobModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: jobs,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ??
          error?.message ??
          'Unexpected error occurred',
        error?.status ?? error?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const job = await this.jobModel.findById(id).populate({
        path: 'createdBy',
        model: 'User',
        select: 'firstName lastName profileImage email',
      });
      if (!job) throw new NotFoundException('Job not found');
      return job;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(id: string, updateData: UpdateJobDto) {
    try {
      const job = await this.jobModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!job) throw new NotFoundException('Job not found');
      return job;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async delete(id: string) {
    try {
      const job = await this.jobModel.findByIdAndDelete(id);
      if (!job) throw new NotFoundException('Job not found');
      return { message: 'Job deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
