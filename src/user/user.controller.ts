import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Get,
  Req,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ChangePasswordDto,
  ClientTypeDto,
  CreateUserDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  QuestionDto,
  FreelancerQuestionTypeListDto,
  UpdateVisibleDto,
  VerifyOtpDto,
} from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/config/response';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserClientQuestionTypeEnum,
  UserQuestionTypeEnum,
} from './enum/user.enum';

@Controller('api/v1/user')
@ApiTags('User/Freelancer')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete('delete/email')
  @ApiOperation({
    summary: 'delete user by email',
  })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'joseph@gmail.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unable to delete user' })
  async deleteUserByEmail(@Body() email: { email: string }) {
    await this.userService.deleteUserByMail(email);
    return successResponse({
      message: 'User deleted',
      code: HttpStatus.OK,
      status: 'success',
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create User',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create user' })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.userService.create(createUserDto);
    return successResponse({
      message: 'User created successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put('client-type/:id')
  @ApiOperation({
    summary: 'Update Client type',
    description: 'Updates client type to either single or agency.',
  })
  @ApiBody({ type: ClientTypeDto })
  @ApiResponse({
    status: 200,
    description: 'client type updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  async updateClientType(
    @Param('id') user: string,
    @Body() clientTypeDto: ClientTypeDto,
  ) {
    const data = await this.userService.updateUser(user, clientTypeDto);
    return successResponse({
      message: 'client type updated successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('login')
  @ApiOperation({
    summary: 'User Login',
    description: 'Logs in the user and returns a JWT token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token.',
  })
  @ApiResponse({ status: 400, description: 'Something went wrong' })
  async login(@Body() dto: LoginDto) {
    //data
    const data = await this.userService.login(dto);
    return successResponse({
      message: 'Login successful.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('logged-in')
  @ApiOperation({
    summary: 'Get logged in user',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unable to retrieve user' })
  async loggedInUser(@Req() req: any) {
    const userId = req.user._id;
    console.log('user details', req.user);

    if (!req) {
      throw new UnauthorizedException('User not authenticated');
    }
    const data = await this.userService.loggedInUser(userId);
    return successResponse({
      message: 'User retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP',
    description:
      'Verifies the OTP sent to the user email and activates the account.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'User verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.userService.verifyOtp(dto);
    return successResponse({
      message: 'User verified successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('resend-otp')
  @ApiOperation({
    summary: 'Resend OTP',
    description: 'Sends a new OTP to the user’s email for verification.',
  })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'New OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'User not found.' })
  async resendOtp(@Body('email') email: string) {
    const data = await this.userService.resendOtp(email);
    return successResponse({
      message: 'New OTP sent to email.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Requests a password reset OTP via email.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent.' })
  @ApiResponse({ status: 400, description: 'User not found.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.userService.forgotPassword(dto);
    return successResponse({
      message: 'Password reset OTP sent.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('questions')
  @ApiOperation({
    summary: 'Post Questions',
  })
  @ApiBody({ type: FreelancerQuestionTypeListDto })
  @ApiResponse({ status: 200, description: 'Question created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create Question' })
  async createQuestion(
    @Body() questionTypeListDto: FreelancerQuestionTypeListDto,
  ) {
    const data = await this.userService.createQuestion(questionTypeListDto);
    return successResponse({
      message: 'Question created successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('questions')
  @ApiOperation({
    summary: 'Get questions based on type on params',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Fetch questions based on type',
    type: String,
    enum: UserQuestionTypeEnum,
    example: `e.g experience, paymentType, interest, primarySkill`,
  })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unable to retrieve questions' })
  async fetchQuestions(@Query('type') type: string) {
    const data = await this.userService.fetchQuestion(type);
    return successResponse({
      message: 'Question retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('client/questions')
  @ApiOperation({
    summary: 'Get clients questions based on type on params',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'Fetch questions based on type',
    type: String,
    enum: UserClientQuestionTypeEnum,
    example: `e.g workPreference, budget, typeOfProject, agencyStaffNo, projectSize, hireType`,
  })
  @ApiResponse({
    status: 200,
    description: 'Client question retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unable to retrieve client questions',
  })
  async fetchClientQuestion(@Query('type') type: string) {
    const data = await this.userService.fetchQuestion(type);
    return successResponse({
      message: 'Client retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change Password',
    description: 'Allows an authenticated user to change their password.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid old password or user not found.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user._id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const data = await this.userService.changePassword(userId, dto);
    return successResponse({
      message: 'Password changed successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put('visibility')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update User Visibility',
    description:
      'Allows an authenticated user to update their visibility status.',
  })
  @ApiBody({ type: UpdateVisibleDto })
  @ApiResponse({ status: 200, description: 'Visibility updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid user or input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateVisible(@Req() req: any, @Body() dto: UpdateVisibleDto) {
    const userId = req.user._id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const data = await this.userService.updateVisible(userId, dto);
    return successResponse({
      message: 'Visibility updated successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('delete-account')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete Account',
    description: 'Allows an authenticated user to delete their account.',
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid password or user not found.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
    const userId = req.user._id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const data = await this.userService.deleteAccount(userId, dto);
    return successResponse({
      message: 'Account deleted successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put('edit-profile/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Edit user profile',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  async editUserProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user._id;
    const data = await this.userService.editUserProfile(user, updateUserDto);
    return successResponse({
      message: 'User profile updated successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put('update-question/:id')
  @ApiOperation({
    summary: 'Update Question',
    description: 'Updates or creates a user question entry.',
  })
  @ApiBody({ type: QuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  async updateQuestion(@Param('id') user: string, @Body() dto: any) {
    const data = await this.userService.updateQuestion(dto, user);
    return successResponse({
      message: 'Question updated successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put(':id/profile-picture')
  @ApiOperation({
    summary: 'Upload profile picture for the user, use form data (Key: file)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file or image not found');
    await this.userService.uploadProfilePicture(userId, file);
    return successResponse({
      message: 'Profile picture uploaded successfully',
      code: HttpStatus.OK,
      status: 'success',
    });
  }
}
