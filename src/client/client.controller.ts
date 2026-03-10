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
} from '@nestjs/common';

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
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { UserService } from 'src/user/user.service';
import {
  ChangePasswordDto,
  ClientTypeDto,
  CreateUserDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  QuestionDto,
  UpdateVisibleDto,
  VerifyOtpDto,
  ClientQuestionTypeListDto,
  ClientQuestionDto,
} from 'src/user/dto/create-user.dto';
import {
  ClientAgencyQuestionTypeEnum,
  ClientQuestionTypeEnum,
} from './enum/client.enum';

@Controller('api/v1/client')
@ApiTags('Client')
export class ClientController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create client',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: 'Client created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create client' })
  async create(@Body() createUserDto: CreateUserDto) {
    const { accountType } = createUserDto;
    if (accountType !== 'client')
      throw new BadRequestException('Account type must be client');
    const data = await this.userService.create(createUserDto);
    return successResponse({
      message: 'Client created successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP',
    description:
      'Verifies the OTP sent to the clinet email and activates the account.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Client verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.userService.verifyOtp(dto);
    return successResponse({
      message: 'Client verified successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Post('resend-otp')
  @ApiOperation({
    summary: 'Resend OTP',
    description: `Sends a new OTP to the client's email for verification.`,
  })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'New OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'Client not found.' })
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
  @ApiResponse({ status: 400, description: 'Client not found.' })
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
  @ApiBody({ type: ClientQuestionTypeListDto })
  @ApiResponse({ status: 200, description: 'Question created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create Question' })
  async createQuestion(@Body() questionTypeListDto: ClientQuestionTypeListDto) {
    const data = await this.userService.createQuestion(questionTypeListDto);
    return successResponse({
      message: 'Question created successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('questions/single-agency')
  @ApiOperation({
    summary: 'Get questions based on type on params',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Fetch questions based on type',
    type: String,
    enum: ClientQuestionTypeEnum,
    example: `e.g clientProjectType, clientWorkPreference, clientBudget, clientJobType`,
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

  @Get('questions/agency-account')
  @ApiOperation({
    summary: 'Get clients questions based on type on params',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'Fetch questions based on type',
    type: String,
    enum: ClientAgencyQuestionTypeEnum,
    example: `e.g numberOfStaff, sizeOfProject, jobType`,
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
      message: 'Questions retrieved successfully',
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
    summary: 'Client Login',
    description: 'Logs in the user and returns a JWT token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token.',
  })
  @ApiResponse({ status: 400, description: 'Invalid email or password.' })
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
    summary: 'Get logged in Client',
  })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unable to retrieve client' })
  async loggedInUser(@Req() req: any) {
    const userId = req.user._id;
    console.log('user details', req.user);

    if (!req) {
      throw new UnauthorizedException('Client not authenticated');
    }
    const data = await this.userService.loggedInUser(userId);
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
    description: 'Allows an authenticated client to change their password.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid old password or client not found.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user._id;
    if (!userId) {
      throw new UnauthorizedException('Client not authenticated');
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
    summary: 'Update Client Visibility',
    description:
      'Allows an authenticated Client to update their visibility status.',
  })
  @ApiBody({ type: UpdateVisibleDto })
  @ApiResponse({ status: 200, description: 'Visibility updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid client or input.' })
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
    description: 'Allows an authenticated client to delete their account.',
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid password or client not found.',
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
    summary: 'Edit client profile',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Client profile updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  async editUserProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user._id;
    const data = await this.userService.editUserProfile(user, updateUserDto);
    return successResponse({
      message: 'Client profile updated successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Put('update-question/:id')
  @ApiOperation({
    summary: 'Update Question',
    description: 'Updates or creates a client question entry.',
  })
  @ApiBody({ type: ClientQuestionDto })
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
    summary: 'Upload profile picture for the client, use form data (Key: file)',
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
  @ApiResponse({ status: 404, description: 'Client not found' })
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
