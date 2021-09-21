/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FileNode,
  FileTreeDocument,
  FolderNode,
} from '../schemas/fileTree.schema';
import { StorageService } from '../feature/storage/storage.service';
import { UploadFileDTO } from './Dto/uploadFile.dto';

@Injectable()
export class ApptrayService {
  constructor(
    private readonly storage: StorageService,
    @InjectModel('FileTree') private readonly fileTree: Model<FileTreeDocument>,
  ) {}

  async upload(fileUpload: UploadFileDTO, uid: string) {
    try {
      // Create a new file tree for user if they dont already have one
      const userFiles =
        (await this.fileTree.findOne({ user: uid })) ??
        new this.fileTree({
          user: uid,
          tree: JSON.stringify({ folderName: 'root', files: [], folders: [] }),
        });

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '/'
      if (fileUpload.path.includes('//')) {
        throw new HttpException(
          'Invalid Path: ' + fileUpload.path,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.storage.uploadFile(
        `apptray/${uid}/${fileUpload.path}`,
        fileUpload.formData.file_buffer,
        fileUpload.formData.type,
      );

      const filePath = fileUpload.path
        .substring(0, fileUpload.path.lastIndexOf('/'))
        .split('/');
      const fileName = fileUpload.path.substring(
        fileUpload.path.lastIndexOf('/') + 1,
        fileUpload.path.length,
      );

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.updateFileTree(tree, filePath, {
          fileName,
          fileType: fileUpload.formData.type,
          metaData: { shared: [] },
        }),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async createFolder(path: string, uid: string): Promise<void> {
    try {
      path += '__cuikapps_folder_placeholder__.txt';

      // Create a new file tree for user if they dont already have one
      const userFiles =
        (await this.fileTree.findOne({ user: uid })) ??
        new this.fileTree({
          user: uid,
          tree: JSON.stringify({ folderName: 'root', files: [], folders: [] }),
        });

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '/'
      if (path.includes('//')) {
        throw new HttpException(
          'Invalid Path: ' + path,
          HttpStatus.BAD_REQUEST,
        );
      }
      //Upload folder
      await this.storage.uploadFile(
        `apptray/${uid}/${path}`,
        '00 00',
        'text/plain',
      );

      const folderPath = path.substring(0, path.lastIndexOf('/')).split('/');
      const fileName = path.substring(path.lastIndexOf('/') + 1, path.length);

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.updateFileTree(tree, folderPath, {
          fileName,
          fileType: 'text/plain',
          metaData: { shared: [] },
        }),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  private updateFileTree(
    fileTree: FolderNode,
    filePath: string[],
    file: FileNode,
  ): FolderNode {
    // If nest at the correct path the we add file to the files
    if (filePath.length === 0) {
      fileTree.files.push(file);

      return fileTree;
    }
    if (fileTree.folders.length > 0) {
      for (let i = 0; i < fileTree.folders.length; i++) {
        if (fileTree.folders[i].folderName === filePath[0]) {
          filePath.shift();

          fileTree.folders[i] = this.updateFileTree(
            fileTree.folders[i],
            filePath,
            file,
          );

          break;
        }
      }
      return fileTree;
    }

    fileTree.folders.push({
      folderName: filePath[0],
      folders: [],
      files: [],
      metaData: {
        shared: [],
      },
    });

    for (let i = 0; i < fileTree.folders.length; i++) {
      if (fileTree.folders[i].folderName === filePath[0]) {
        filePath.shift();

        fileTree.folders[i] = this.updateFileTree(
          fileTree.folders[i],
          filePath,
          file,
        );

        break;
      }
    }
    return fileTree;
  }
}
