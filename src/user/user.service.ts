import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  ClientTypeDto,
  CreateUserDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  FreelancerQuestionTypeListDto,
  UpdateVisibleDto,
  VerifyOtpDto,
  ClientQuestionTypeListDto,
} from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import {
  AlphaNumeric,
  comparePassword,
  generateAccessToken,
  hashPassword,
  RandomSixDigits,
} from 'src/core/common/utils/authentication';
import { MailService } from 'src/core/mail/email';
import { Question } from './schemas/question.schema';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { QuestionTypeList } from './schemas/question-type.schema';
import { Invite } from 'src/project/schemas/invite.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import { InviteWithProject } from 'src/project/enumAndTypes/project.enum';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(QuestionTypeList.name)
    private questionTypeModel: Model<QuestionTypeList>,
    @InjectModel(Invite.name) private inviteModel: Model<Invite>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  //delete user
  async deleteUserByMail(data: { email: string }) {
    const { email } = data;
    if (!email)
      throw new BadGatewayException('email field cannot be null or empty');
    await this.userModel.findOneAndDelete({ email });
    return 'User deleted successfully';
  }

  async createQuestion(
    questionTypeDto: FreelancerQuestionTypeListDto | ClientQuestionTypeListDto,
  ) {
    try {
      const questions = await this.questionTypeModel.create(questionTypeDto);
      if (!questions) throw new BadGatewayException('Unable to save questions');
      return questions;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async fetchQuestion(type: string) {
    try {
      const questions = await this.questionTypeModel.find({ type });
      if (!questions) throw new BadGatewayException('Unable to save questions');
      return questions;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const { email, password } = createUserDto;
      const validateUser = await this.userModel.findOne({ email });
      if (validateUser) throw new BadGatewayException('Email already exist');
      const otp = RandomSixDigits();
      const hashedPassword = await hashPassword(password);
      const createUser = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
        verificationOtp: otp,
      });

      try {
        await this.mailService.sendMailNotification(
          email,
          'Welcome to Teevil',
          { name: createUserDto.firstName, otp },
          'welcome',
        );

        const invites = (await this.inviteModel
          .find({ email })
          .populate({
            path: 'projectId',
            model: 'Project',
            select: 'title _id',
          })
          .lean()) as any as InviteWithProject[];

        if (invites.length > 0) {
          for (const invite of invites) {
            await this.notificationService.create({
              title: 'Project Invitation',
              content: `You have been invited to join project: ${invite.projectId?.title ?? ''}`,
              notificationType: 'project',
              userType: 'user',
              user: createUser._id.toString(),
              projectId: `${invite.projectId._id}`,
            });
          }
          await this.inviteModel.deleteMany({ email });
        }
      } catch (error) {
        console.log('email notification error:', error);
      }

      delete createUser.password;

      await this.notificationService.create({
        title: 'Welcome 🤝',
        content: `Congratulations!!! you are now a register user on Teevil`,
        notificationType: 'Registration',
        userType: 'user',
        user: createUser._id.toString(),
      });

      return createUser;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  //edit user profile
  async editUserProfile(user: string, UpdateUserDto: UpdateUserDto) {
    try {
      const validateUser = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(user),
      });

      if (!validateUser) throw new BadRequestException('Invalid user id');

      await this.userModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(user),
        },
        { ...UpdateUserDto },
        { new: true, runValidators: true },
      );
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  //update user
  async updateUser(user: string, payload: ClientTypeDto) {
    try {
      const validateUser = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(user),
      });

      if (!validateUser) throw new BadRequestException('Invalid user id');

      await this.userModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(user),
        },
        { ...payload },
        { new: true, runValidators: true },
      );
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async login(dto: LoginDto): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email: dto.email });

      if (!user || !(await comparePassword(dto.password, user.password))) {
        throw new BadRequestException('Invalid email or password');
      }

      if (!user.isVerified) {
        throw new BadRequestException(
          'Unverified user, kindly verify your account',
        );
      }

      //get bio
      const userBio = await this.questionModel.findOne({
        user: new mongoose.Types.ObjectId(user._id),
      });

      const bio = userBio ? userBio.bio : {};
      const token = generateAccessToken({
        _id: user._id,
        accountType: user.accountType,
      });

      return {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          accountType: user.accountType,
          profileImage: user.profileImage,
          bio,
        },
        token,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async loggedInUser(userId: string) {
    try {
      console.log('userid', userId);
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      if (!user) throw new BadRequestException('Invalid user');

      delete user.password;

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        accountType: user.accountType,
        profileImage: user.profileImage,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    try {
      const user = await this.userModel.findOne({ email: dto.email });

      if (!user || user.verificationOtp !== dto.otp) {
        throw new BadRequestException('Invalid OTP');
      }

      user.isVerified = true;
      user.verificationOtp = null;
      await user.save();

      return { message: 'User verified successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async resendOtp(email: string) {
    try {
      const user = await this.userModel.findOne({ email });

      if (!user) throw new BadRequestException('User not found');

      const otp = RandomSixDigits();
      user.verificationOtp = otp;
      await user.save();

      await this.mailService.sendMailNotification(
        email,
        'New OTP',
        { otp },
        'otp_resend',
      );
      return { message: 'New OTP sent to email' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const user = await this.userModel.findOne({ email: dto.email });
      if (!user) throw new BadRequestException('User not found');
      //generate random password
      const dummyPassword = AlphaNumeric(6);
      const hashedPassword = await hashPassword(dummyPassword);
      user.password = hashedPassword;
      await user.save();
      await this.mailService.sendMailNotification(
        dto.email,
        'Forgot Password',
        { name: user.firstName, dummyPassword },
        'forgot-password',
      );

      return { message: 'Password reset OTP sent' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.userModel.findOne(
        {
          _id: new mongoose.Types.ObjectId(userId),
        },
        { password: 1 },
      );

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!(await comparePassword(dto.oldPassword, user.password))) {
        throw new BadRequestException('Old and new password does not match');
      }

      user.password = await hashPassword(dto.newPassword);
      await user.save();

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  /**
   * questions services
   */

  async updateQuestion(dto: any, user: string) {
    try {
      const { title, bio, ...restOfData } = dto;

      // Ensure the bio structure matches the schema
      if (title || bio) {
        restOfData.bio = {
          title: title || null,
          bio: bio || null,
        };
      }

      const validateUser = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(user),
      });

      if (!validateUser) throw new BadRequestException('Invalid user id');

      const validateQuestion = await this.questionModel.findOne({
        user: new mongoose.Types.ObjectId(user),
      });
      if (validateQuestion) {
        const updateQuestion = await this.questionModel.findOneAndUpdate(
          { user: new mongoose.Types.ObjectId(user) },
          { ...restOfData },
          { new: true, runValidators: true, upsert: true },
        );
        if (!updateQuestion)
          throw new BadRequestException('Unable to update question');
        return updateQuestion;
      }
      const question = await this.questionModel.create({
        user: new mongoose.Types.ObjectId(user),
        ...restOfData,
      });

      if (!question) throw new BadRequestException('Unable to update question');

      return question;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    try {
      const user = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });
      if (!user) throw new NotFoundException('User not found');
      const uploadImage = await this.uploadUserImage(file);
      user.profileImage = uploadImage;

      await user.save();
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private async uploadUserImage(file: Express.Multer.File | undefined) {
    try {
      if (!file) {
        return null;
      }
      const uploadedFile = await this.cloudinaryService.uploadFile(
        file,
        'profile-image',
      );

      return uploadedFile.secure_url;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async updateVisible(userId: string, dto: UpdateVisibleDto) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      user.visible = dto.visible;
      await user.save();

      return {
        message: 'Visibility updated successfully',
        visible: user.visible,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.userModel.findOne(
        {
          _id: new mongoose.Types.ObjectId(userId),
        },
        { password: 1 },
      );

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!(await comparePassword(dto.password, user.password))) {
        throw new BadRequestException('Incorrect password');
      }

      await this.userModel.deleteOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? 500,
      );
    }
  }
}
