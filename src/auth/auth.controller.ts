/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  StreamableFile,
  Header,
  Param,
  HttpException,
  HttpStatus,
  Delete,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AuthGuard } from '../gaurds/auth.guard';
import { UserAuthDto } from '../user/Dto/userAuth.dto';
import { UserCreateDto } from '../user/Dto/userCreate.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { UserUpdateDto } from '../user/Dto/userUpdate.dto';
import { UserDto } from '../user/Dto/user.dto';
import { EnvService } from '../feature/env/env.service';
import { UserPassResetDto } from '../user/Dto/userPassReserDto';
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
    private readonly env: EnvService,
  ) {}

  @Post('/sign-in')
  async signIn(
    @Body() userInfo: UserAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    try {
      const token = await this.auth.signIn(userInfo.email, userInfo.password);

      res.cookie('token', token, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        domain: this.env.Dev ? undefined : 'cuikapps.com',
        secure: !this.env.Dev,
        sameSite: this.env.Dev ? undefined : 'strict',
        path: '/',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/sign-out')
  @UseGuards(AuthGuard)
  async signOut(@Res({ passthrough: true }) res: Response): Promise<void> {
    res.cookie('token', 'none', {
      maxAge: -60,
      httpOnly: true,
      domain: this.env.Dev ? undefined : 'cuikapps.com',
      secure: !this.env.Dev,
      sameSite: this.env.Dev ? undefined : 'strict',
      path: '/',
    });
  }

  @Post('/sign-up')
  async signUp(@Body() userInfo: UserCreateDto) {
    console.log(userInfo);

    try {
      if (userInfo.displayName) {
        await this.auth.signUpWithName(
          userInfo.email,
          userInfo.password,
          userInfo.displayName,
        );
        return 'User Created';
      } else {
        await this.auth.signUp(userInfo.email, userInfo.password);
        return 'User Created';
      }
    } catch (error) {
      throw new HttpException(
        'User Creation Failed + ' + error,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/get-this-user')
  @UseGuards(AuthGuard)
  async getThisUser(@Req() req: Request): Promise<UserDto> {
    // Gets the user by id using the uid in the auth token
    try {
      const user = await this.users.userById(
        req.cookies?.['token'].split('-')[0],
      );
      return this.users.toSimpleUser(user);
    } catch (error) {
      throw new HttpException(error, HttpStatus.UNAUTHORIZED);
    }
  }

  @Delete('/delete-this-user')
  @UseGuards(AuthGuard)
  async deleteThisUser(@Req() req: Request) {
    // Gets the user by id using the uid in the auth token
    try {
      return await this.users.deleteUser(req.cookies?.['token'].split('-')[0]);
    } catch (error) {
      throw new HttpException(error, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('/update-this-user')
  @UseGuards(AuthGuard)
  async updateThisUser(
    @Req() req: Request,
    @Body() userUpdateDto: UserUpdateDto,
  ) {
    console.log(userUpdateDto);

    // Gets the user by id using the uid in the auth token
    try {
      return await this.users.updateUser(
        req.cookies?.['token'].split('-')[0],
        userUpdateDto,
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('/reset-password')
  @UseGuards(AuthGuard)
  async resetPassword(
    @Req() req: Request,
    @Body() userPassResetDto: UserPassResetDto,
  ) {
    await this.auth.resetPassword(userPassResetDto, req.cookies?.['token']);
  }

  @Get('/confirm-password-reset')
  async confirmPassReset(@Query('verification') verification: string) {
    try {
      await this.auth.verifyPasswordToken(verification);

      return `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="utf-8" />
      <title>Password Reset</title>
      </head>
      <body>
      <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');html, body {background-color: #e7e7de; display: flex; flex-direction: column; align-items: center; justify-content: space-around;} h1, h3{color: #0f3057; font-family: 'Poppins', sans-serif;}
      </style>
      <h1>You have changed your password.</h1><h3>You can now close this page</h3>
      </body>
      </html>`;
    } catch (error) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }

  @Post('/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('ext') ext: string,
    @Query('uid') uid: string,
  ): Promise<void> {
    if (uid !== '') {
      try {
        const normalFilePath = `uploads/profileImages/${uid}.${ext}`;

        await this.auth.uploadUserPhoto(normalFilePath, file, uid, ext);
      } catch (error) {
        throw new HttpException(error, HttpStatus.CONFLICT);
      }
    } else {
      throw new HttpException('Invalid File Name', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/get-profile-image/:imageName')
  @Header('Content-Type', 'image/*')
  async getProfilePic(
    @Param('imageName') imgName: string,
  ): Promise<StreamableFile> {
    try {
      return this.auth.getUserImage(imgName);
    } catch (error) {
      throw new HttpException(error, HttpStatus.CONFLICT);
    }
  }

  @Post('/confirm-email')
  @UseGuards(AuthGuard)
  async confirmEmail(@Query('email') email: string) {
    try {
      const user = await this.users.userByEmail(email);
      await this.auth.verifyUserEmail(user);
    } catch (error) {
      throw new HttpException(error, HttpStatus.CONFLICT);
    }
  }

  @Get('/confirm-email-verification')
  @Header('content-type', 'text/html')
  async confirmEmailVerification(@Query('verification') verification: string) {
    const user = await this.users.userByEmail(verification.split('-')[0]);

    if (this.auth.verifyConfirmationToken(verification)) {
      user.emailVerified = true;
      await user.save();

      return `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="utf-8" />
      <title>Verified</title>
      </head>
      <body>
      <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');html, body {background-color: #e7e7de; display: flex; flex-direction: column; align-items: center; justify-content: space-around;} h1, h3{color: #0f3057; font-family: 'Poppins', sans-serif;}
      </style>
      <h1>You have successfully verified your email.</h1><h3>You can now close this page</h3>
      </body>
      </html>`;
    } else {
      throw new HttpException('Invalid Token', HttpStatus.FORBIDDEN);
    }
  }
}
