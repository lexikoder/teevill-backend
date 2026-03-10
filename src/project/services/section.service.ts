import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Project } from '../schemas/project.schema';
import { CreateSectionDto } from '../dto/create-project.dto';
import { Section } from '../schemas/section.schema';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { UpdateSectionDto } from '../dto/update-project.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Section.name) private sectionModel: Model<Section>,
  ) {}

  async createSection(payload: CreateSectionDto) {
    try {
      const { title, projectId } = payload;

      const [validateSection, validateProject] = await Promise.all([
        await this.sectionModel.findOne({
          title,
          project: new mongoose.Types.ObjectId(projectId),
        }),

        await this.projectModel.findOne({
          _id: new mongoose.Types.ObjectId(projectId),
        }),
      ]);

      if (validateSection || !validateProject)
        throw new BadRequestException(
          'Section already exist or Invalid project',
        );

      const section = await this.sectionModel.create({
        title,
        project: new mongoose.Types.ObjectId(projectId),
      });
      if (!section) throw new BadRequestException('Unable to create section');
      await this.projectModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(projectId) },
        {
          $push: { sections: section._id },
        },
      );
      return section;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findAll(query: PaginationDto, userId: string, projectId: string) {
    try {
      const { search, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const filter: any = {
        $or: [
          { project: new mongoose.Types.ObjectId(projectId) },
          { usersAdded: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ],
      };
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      const sections = await this.sectionModel
        .find(filter)
        .populate({
          path: 'usersAdded',
          model: 'User',
          populate: {
            path: 'firstName lastName profileImage',
          },
        })
        .skip(skip)
        .limit(limit);

      const total = await this.sectionModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: sections,
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
      const section = await this.sectionModel
        .findById(id)
        .populate({
          path: 'usersAdded',
          model: 'User',
          populate: {
            path: 'firstName lastName profileImage',
          },
        })
        .populate({ path: 'project', model: 'Project' });
      if (!section) throw new NotFoundException('Section not found');
      return section;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(id: string, updateData: UpdateSectionDto) {
    try {
      const updateSection = await this.projectModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );
      if (!updateSection) throw new NotFoundException('Section not found');
      return updateSection;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async delete(id: string) {
    try {
      const deleteSection = await this.sectionModel.findByIdAndDelete(id);
      if (!deleteSection) throw new NotFoundException('Section not found');
      return { message: 'Section deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
