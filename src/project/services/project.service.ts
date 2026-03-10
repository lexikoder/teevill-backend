import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Project } from '../schemas/project.schema';
import {
  AcceptProjectDto,
  CreateInviteDto,
  CreateProjectDto,
} from '../dto/create-project.dto';
import { Section } from '../schemas/section.schema';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { PaginationDto } from 'src/core/common/pagination/pagination';
import { MailService } from 'src/core/mail/email';
import { Invite } from '../schemas/invite.schema';
import { User } from 'src/user/schemas/user.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import { PopulatedProjectDocument } from '../enumAndTypes/project.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Section.name) private sectionModel: Model<Section>,
    @InjectModel(Invite.name) private inviteModel: Model<Invite>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  async createProject(payload: CreateProjectDto & { createdBy: string }) {
    try {
      const { createdBy, title, description, deadline, section, projectType } =
        payload;

      const validateProject = await this.projectModel.findOne({
        $or: [
          { createdBy: new mongoose.Types.ObjectId(createdBy) },
          { usersAdded: { $in: [new mongoose.Types.ObjectId(createdBy)] } },
        ],
        title,
      });

      if (validateProject)
        throw new BadRequestException('Project with the title already exists');

      const project = await this.projectModel.create({
        createdBy: new mongoose.Types.ObjectId(createdBy),
        title,
        description,
        deadline,
        projectType,
      });

      if (!project) throw new BadRequestException('Unable to create project');

      const sections = await this.sectionModel.insertMany(
        section.map((title) => ({
          title,
          project: new mongoose.Types.ObjectId(project._id),
        })),
      );

      const sectionIds = sections.map((sec) => sec._id);
      project.usersAdded.push(new mongoose.Types.ObjectId(createdBy));
      project.sections = sectionIds;
      await project.save();

      await this.notificationService.create({
        title: 'Project',
        content: `You project with title: ${title} has been created`,
        notificationType: 'Project',
        userType: 'user',
        user: createdBy.toString(),
      });

      return project;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // add or invite collaborator
  async createInvite(payload: CreateInviteDto, userId: string) {
    try {
      const { email, projectId, sections } = payload;

      const projectExists = await this.projectModel.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        $or: [
          { createdBy: new mongoose.Types.ObjectId(userId) },
          { usersAdded: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ],
      });
      if (!projectExists) throw new NotFoundException('Project not found');

      let invite;
      try {
        //verify invitee
        const validateFreelancer = await this.userModel.findOne({ email });
        if (!validateFreelancer)
          throw new NotFoundException(
            'Invited freelancer not registered on Teevil',
          );

        invite = await this.inviteModel.create({
          email,
          projectId: new mongoose.Types.ObjectId(projectId),
          sections: sections.map((id) => new mongoose.Types.ObjectId(id)),
        });

        await this.mailService.sendMailNotification(
          email,
          'Teevil: Project Invitation',
          {
            name: projectExists.title,
            link: 'https://localhost.com',
          },
          'project_invite',
        );
        if (validateFreelancer) {
          await this.notificationService.create({
            title: 'Project Invitation',
            userType: 'user',
            content: `You have been invited to participate in a project: ${projectExists.title}, you can either accept or decline the project`,
            notificationType: 'project',
            user: `${validateFreelancer._id}`,
            projectId: `${projectExists.id}`,
          });

          await this.mailService.sendMailNotification(
            email,
            'Teevil: Project Invitation',
            {
              name: projectExists.title,
            },
            'project_invite',
          );

          await this.notificationService.create({
            title: 'Invite',
            content: `Your invite to email: ${email} has been sent`,
            notificationType: 'Invite',
            userType: 'user',
            user: userId.toString(),
          });
        }
        return invite;
      } catch (error) {
        console.log('email notification error:', error);
      }
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findAll(
    query: PaginationDto & { projectType: string } & { status: string },
    userId: string,
  ) {
    try {
      const { search, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const filter: any = {
        $or: [
          { createdBy: new mongoose.Types.ObjectId(userId) },
          { usersAdded: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ],
      };
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      if (query.projectType) {
        filter.projectType = query.projectType;
      }

      if (query.status) {
        filter.status = query.status;
      }
      const projects = await this.projectModel
        .find(filter)
        .populate({ path: 'sections', model: 'Section' })
        .populate({
          path: 'createdBy',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .populate({
          path: 'usersAdded',
          model: 'User',
          select: 'firstName lastName profileImage email',
        })
        .skip(skip)
        .limit(limit);

      const total = await this.projectModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: projects,
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
      const project = await this.projectModel
        .findById(id)
        .populate({
          path: 'sections',
          model: 'Section',
          populate: {
            path: 'tasks',
          },
        })
        .populate({
          path: 'createdBy',
          model: 'User',
          select: 'firstName lastName profileImage email',
        });
      if (!project) throw new NotFoundException('Project not found');
      return project;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(id: string, updateData: UpdateProjectDto) {
    try {
      const updatedProject = await this.projectModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );
      if (!updatedProject) throw new NotFoundException('Project not found');
      return updatedProject;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async delete(id: string) {
    try {
      const deletedProject = await this.projectModel.findByIdAndDelete(id);
      if (!deletedProject) throw new NotFoundException('Project not found');
      return { message: 'Project deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async acceptProject(
    projectId: string,
    userId: string,
    body: AcceptProjectDto,
  ) {
    try {
      const { status } = body;
      const user = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });
      const project = (await this.projectModel
        .findOne({ _id: new mongoose.Types.ObjectId(projectId) })
        .populate({
          path: 'createdBy',
          model: 'User',
          select: '_id email firstName',
        })) as any as PopulatedProjectDocument;

      if (!project) throw new NotFoundException('Project not found');

      if (status === 'accepted') {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const alreadyAdded = project.usersAdded.some((id) =>
          id.equals(userObjectId),
        );
        if (alreadyAdded) {
          throw new BadRequestException('User already added to the project');
        }
        project.usersAdded.push(userObjectId);
        await project.save();
      }

      try {
        await this.mailService.sendMailNotification(
          project.createdBy?.email,
          'Teevil Invitation Update',
          {
            title: project.title,
            name: user.firstName,
            freelancer: project.createdBy.firstName,
            status,
          },
          'project_update',
        );

        await this.notificationService.create({
          title: 'Project Notification Update',
          content: `Your Project: ${project.title} has been ${status} by ${project.createdBy.firstName}`,
          notificationType: 'Invite',
          userType: 'user',
          user: userId.toString(),
        });
      } catch (error) {
        console.log('project inivitation error:', error);
      }

      return project;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getProjectUsers(projectId: string) {
    try {
      const project = await this.projectModel.findById(projectId).populate({
        path: 'usersAdded',
        model: 'User',
        select: 'firstName lastName profileImage email phone',
      });

      if (!project) {
        throw new NotFoundException('Project not found or invalid project id');
      }

      return project.usersAdded;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
