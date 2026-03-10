import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Proposal } from '../schemas/proposal.schema';
import {
  CreateProposalDto,
  ProposalStatusDto,
} from '../dto/create-proposal.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { Job } from 'src/job/schemas/job.schema';
import { MailService } from 'src/core/mail/email';
import { UserDocument } from '../../user/schemas/user.schema';

@Injectable()
export class ProposalService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    private readonly mailService: MailService,
  ) {}

  async createPropsosal(payload: CreateProposalDto & { submittedBy: string }) {
    const { submittedBy } = payload;

    try {
      const validateProposal = await this.proposalModel.findOne({
        submittedBy: new mongoose.Types.ObjectId(submittedBy),
        job: new mongoose.Types.ObjectId(payload.job),
      });

      if (validateProposal) {
        throw new BadRequestException(
          'Proposal already submitted for this job',
        );
      }

      const proposal = await this.proposalModel.create({
        ...payload,
        submittedBy: new mongoose.Types.ObjectId(submittedBy),
        job: new mongoose.Types.ObjectId(payload.job),
      });

      if (!proposal) {
        throw new BadRequestException('Error submitting proposal');
      }

      await this.jobModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(payload.job) },
        { $push: { proposals: proposal._id } },
        { new: true, runValidators: true },
      );

      return proposal;
    } catch (error) {
      throw new HttpException(
        error?.message || 'Internal server error',
        error?.status || 500,
      );
    }
  }

  async findAll(query: PaginationDto & { status?: string }, userId: string) {
    try {
      const { search, page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const filter: any = {
        submittedBy: new mongoose.Types.ObjectId(userId),
      };

      if (status) {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { body: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ];
      }

      const proposals = await this.proposalModel
        .find(filter)
        .populate({
          path: 'job',
          populate: {
            path: 'createdBy',
            select: 'firstName lastName profileImage email',
          },
        })
        .populate({
          path: 'submittedBy',
          select: 'firstName lastName profileImage email',
        })
        .skip(skip)
        .limit(limit);

      const total = await this.proposalModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: proposals,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // fetch all clients proposals
  async findAllProposalsForClients(
    query: PaginationDto & { status?: string },
    userId: string,
  ) {
    try {
      const { search, page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      // First, find all jobs created by the user
      const jobsCreated = await this.jobModel
        .find({ createdBy: new mongoose.Types.ObjectId(userId) })
        .select('_id');

      const jobIds = jobsCreated.map((job) => job._id);

      if (!jobIds.length) {
        return {
          total: 0,
          page,
          limit,
          totalPages: 0,
          data: [],
        };
      }
      const filter: any = {
        job: { $in: jobIds },
      };

      if (status) {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { body: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ];
      }

      const proposals = await this.proposalModel
        .find(filter)
        .populate({
          path: 'job',
          populate: {
            path: 'createdBy',
            select: 'firstName lastName profileImage email',
          },
        })
        .populate({
          path: 'submittedBy',
          select: 'firstName lastName profileImage email',
        })
        .skip(skip)
        .limit(limit);

      const total = await this.proposalModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: proposals,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findOne(id: string) {
    try {
      const proposal = await this.proposalModel
        .findById(id)
        .populate({
          path: 'job',
          populate: {
            path: 'createdBy',
            select: 'firstName lastName profileImage email',
          },
        })
        .populate({
          path: 'submittedBy',
          select: 'firstName lastName profileImage email',
        });

      if (!proposal) throw new NotFoundException('Proposal not found');
      return proposal;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  //update proposal status
  async updateProposal(payload: ProposalStatusDto, id: string) {
    try {
      if (!payload.status)
        throw new BadRequestException('Status cannot be empty');
      const { status } = payload;

      const verifyProposal = await this.proposalModel
        .findOne({
          _id: new mongoose.Types.ObjectId(id),
        })
        .populate({
          path: 'submittedBy',
          model: 'User',
          select: 'firstName lastName email profileImage',
        });

      if (!verifyProposal)
        throw new BadRequestException('Unauthorized to update this proposal');

      verifyProposal.status = status;
      await verifyProposal.save();

      try {
        const submittedUser =
          verifyProposal.submittedBy as unknown as UserDocument;
        const email = submittedUser.email;
        await this.mailService.sendMailNotification(
          email,
          'Teevil: Proposal Update',
          {
            name: 'Proposal Status',
            status,
            title: verifyProposal.title,
          },
          'proposal_status',
        );
      } catch (error) {
        console.log('mail notification error');
      }
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
