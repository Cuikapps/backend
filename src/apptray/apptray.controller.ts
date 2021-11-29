import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { FolderNode } from 'src/schemas/fileTree.schema';
import { AuthGuard } from '../guards/auth.guard';
import { ApptrayService } from './apptray.service';
import { BinaryDTO } from './Dto/binary.dto';
import { DeleteDTO } from './Dto/delete.dto';
import { RenameDTO } from './Dto/rename.dto';
import { SettingsDTO } from './Dto/settings.dto';
import { UploadFolderDTO } from './Dto/uploadFolder.dto';

@Controller('/apptray')
export class ApptrayController {
  constructor(private readonly apptray: ApptrayService) {}

  @Get('/get-settings')
  @UseGuards(AuthGuard)
  async getSettings(@Req() request: Request): Promise<Required<SettingsDTO>> {
    try {
      return await this.apptray.getSettings(
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/set-settings')
  @UseGuards(AuthGuard)
  async SetSettings(
    @Body() settings: SettingsDTO,
    @Req() request: Request,
  ): Promise<Required<SettingsDTO>> {
    try {
      return await this.apptray.updateSettings(
        settings,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/get-files-tree')
  @UseGuards(AuthGuard)
  async getFilesTree(@Req() request: Request): Promise<FolderNode> {
    try {
      return await this.apptray.getFileTree(
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/get-files')
  @UseGuards(AuthGuard)
  async getFiles(
    @Query('data') body: string,
    @Req() request: Request,
  ): Promise<BinaryDTO> {
    try {
      const data = JSON.parse(decodeURIComponent(body));

      const bin = await this.apptray.getFiles(
        data.path,
        data.names,
        request.cookies.token.split('-')[0],
      );

      return { bin };
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
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
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/rename-file')
  @UseGuards(AuthGuard)
  async renameFile(
    @Body() body: RenameDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.renameFile(
        body.filePath,
        body.newName,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/rename-folder')
  @UseGuards(AuthGuard)
  async renameFolder(
    @Body() body: RenameDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.renameFolder(
        body.filePath,
        body.newName,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/delete-file')
  @UseGuards(AuthGuard)
  async deleteFile(
    @Body() body: DeleteDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.deleteFile(
        body.path,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/delete-folder')
  @UseGuards(AuthGuard)
  async deleteFolder(
    @Body() body: DeleteDTO,
    @Req() request: Request,
  ): Promise<void> {
    try {
      await this.apptray.deleteFolder(
        body.path,
        request.cookies.token.split('-')[0],
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }
}
