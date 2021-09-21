/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../gaurds/auth.guard';
import { ApptrayService } from './apptray.service';
import { UploadFileDTO } from './Dto/uploadFile.dto';
import { UploadFolderDTO } from './Dto/uploadFolder.dto';

@Controller('/apptray')
export class ApptrayController {
  constructor(private readonly apptray: ApptrayService) {}

  @Post('/update-config')
  @UseGuards(AuthGuard)
  async updateConfig() {
    return;
  }

  @Post('/upload-file')
  @UseGuards(AuthGuard)
  async uploadFile(
    @Body() body: UploadFileDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.upload(body, request.cookies.token.split('-')[0]);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/upload-folder')
  @UseGuards(AuthGuard)
  async uploadFolder(
    @Body() body: UploadFolderDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.createFolder(
        body.path,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
