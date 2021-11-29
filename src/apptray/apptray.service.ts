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
import { SettingsDTO } from './Dto/settings.dto';
import { UserConfigDocument } from 'src/schemas/userConfig.schema';
import * as fs from 'fs';
import internal from 'stream';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ApptrayService {
  constructor(
    private readonly storage: StorageService,
    @InjectModel('FileTree') private readonly fileTree: Model<FileTreeDocument>,
    @InjectModel('UserConfig')
    private readonly userConfig: Model<UserConfigDocument>,
  ) {}

  private async getUserConfig(uid: string): Promise<UserConfigDocument> {
    return (
      (await this.userConfig.findOne({ uid: uid })) ??
      new this.userConfig({
        uid: uid,
        theme: 'Default',
        searchEngine: 'Google',
        mailProvider: 'Gmail',
      })
    );
  }

  async getSettings(uid: string): Promise<Required<SettingsDTO>> {
    try {
      const userSettings = await this.getUserConfig(uid);

      return {
        mailProvider: userSettings.mailProvider,
        theme: userSettings.theme,
        searchEngine: userSettings.searchEngine,
      };
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async updateSettings(
    settings: SettingsDTO,
    uid: string,
  ): Promise<Required<SettingsDTO>> {
    try {
      const userSettings = await this.getUserConfig(uid);

      if (settings.theme) {
        userSettings.theme = settings.theme;
      }
      if (settings.searchEngine) {
        userSettings.searchEngine = settings.searchEngine;
      }
      if (settings.mailProvider) {
        userSettings.mailProvider = settings.mailProvider;
      }

      await userSettings.save();

      return {
        mailProvider: userSettings.mailProvider,
        theme: userSettings.theme,
        searchEngine: userSettings.searchEngine,
      };
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  private async getUserFiles(uid: string): Promise<FileTreeDocument> {
    return (
      (await this.fileTree.findOne({ user: uid })) ??
      // Create a new file tree for user if they dont already have one
      new this.fileTree({
        user: uid,
        tree: JSON.stringify({
          folderName: 'root',
          files: [],
          folders: [],
          metaData: { shared: [] },
        }),
      })
    );
  }

  async getFileTree(uid: string): Promise<FolderNode> {
    try {
      const userFiles = await this.getUserFiles(uid);

      return (
        JSON.parse(userFiles.tree) ?? {
          folderName: 'root',
          files: [],
          folders: [],
        }
      );
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async createFile(fileUpload: UploadFileDTO, uid: string): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (fileUpload.path.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + fileUpload.path,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Params for the uploadFile Function
      const drive = fileUpload.path.substring(
        0,
        fileUpload.path.indexOf(':') + 1,
      );
      const folderPath = fileUpload.path.substring(
        fileUpload.path.indexOf(':') + 2,
        fileUpload.path.length,
      );

      await this.storage.uploadFile(
        `apptray/${uid}/${drive}/${folderPath}`,
        fileUpload.formData.file_buffer,
        fileUpload.formData.type,
      );

      const filePath = fileUpload.path
        .substring(0, fileUpload.path.lastIndexOf('>'))
        .split('>');
      const fileName = fileUpload.path.substring(
        fileUpload.path.lastIndexOf('>') + 1,
        fileUpload.path.length,
      );

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.createFileInTree(tree, filePath, {
          fileName,
          fileType: fileUpload.formData.type,
          metaData: { shared: [] },
        }),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async continueFileCreation(
    fileUpload: UploadFileDTO,
    uid: string,
    writer?: internal.Writable,
  ): Promise<internal.Writable> {
    try {
      // Checks for 2 or more occurrences of '>'
      if (fileUpload.path.includes('>>')) {
        throw new WsException('Invalid Path: ' + fileUpload.path);
      }

      // Params for the continueUploadFile Function
      const drive = fileUpload.path.substring(
        0,
        fileUpload.path.indexOf(':') + 1,
      );
      const folderPath = fileUpload.path.substring(
        fileUpload.path.indexOf(':') + 2,
        fileUpload.path.length,
      );

      const write = await this.storage.continueUploadFile(
        `apptray/${uid}/${drive}/${folderPath}`,
        fileUpload.formData.file_buffer,
        fileUpload.formData.type,
        writer,
      );

      return write;
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  async finishFileCreation(
    fileUpload: UploadFileDTO,
    uid: string,
    writer: internal.Writable,
  ): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);
      // Checks for 2 or more occurrences of '>'
      if (fileUpload.path.includes('>>')) {
        throw new WsException('Invalid Path: ' + fileUpload.path);
      }

      await new Promise<void>((resolve, reject) => {
        writer.once('error', (err) => {
          reject(err);
        });
        writer.end(() => {
          writer.removeAllListeners();
          resolve();
        });
      });

      const filePath = fileUpload.path
        .substring(0, fileUpload.path.lastIndexOf('>'))
        .split('>');
      const fileName = fileUpload.path.substring(
        fileUpload.path.lastIndexOf('>') + 1,
        fileUpload.path.length,
      );

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.createFileInTree(tree, filePath, {
          fileName,
          fileType: fileUpload.formData.type,
          metaData: { shared: [] },
        }),
      );

      await userFiles.save();
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  async createFolder(path: string, uid: string): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (path.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + path,
          HttpStatus.BAD_REQUEST,
        );
      }

      const filePath = path.substring(0, path.lastIndexOf('>')).split('>');
      const folderName = path.substring(path.lastIndexOf('>') + 1, path.length);

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.createFolderInTree(tree, filePath, {
          folderName,
          folders: [],
          files: [],
          metaData: {
            shared: [],
          },
        }),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async getFiles(
    path: string,
    fileNames: string[],
    uid: string,
  ): Promise<string> {
    // Checks for 2 or more occurrences of '>'
    if (path.includes('>>')) {
      throw new HttpException('Invalid Path: ' + path, HttpStatus.BAD_REQUEST);
    }

    // Params for the renameFile Function
    const drive = path.substring(0, path.indexOf(':') + 1);
    const folderPath = path.substring(path.indexOf(':') + 2, path.length);

    const binary = await this.storage.readApptrayFiles(
      uid,
      drive,
      folderPath,
      fileNames,
    );

    return binary;
  }

  async renameFile(
    oldPath: string,
    newName: string,
    uid: string,
  ): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (oldPath.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + oldPath,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Params for the renameFile Function
      const drive = oldPath.substring(0, oldPath.indexOf(':') + 1);
      const folderPath = oldPath.substring(
        oldPath.indexOf(':') + 2,
        oldPath.length,
      );
      const newFolderPath = `${oldPath.substring(
        oldPath.indexOf(':') + 2,
        oldPath.lastIndexOf('>') + 1,
      )}${newName}`;

      await this.storage.renameFile(uid, drive, folderPath, newFolderPath);

      const filePath = oldPath
        .substring(0, oldPath.lastIndexOf('>'))
        .split('>');
      const oldName = oldPath.substring(
        oldPath.lastIndexOf('>') + 1,
        oldPath.length,
      );

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.renameFileInTree(tree, filePath, oldName, newName),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async renameFolder(
    oldPath: string,
    newName: string,
    uid: string,
  ): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (oldPath.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + oldPath,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Params for the renameFolder Function
      const drive = oldPath.substring(0, oldPath.indexOf(':') + 1);
      const folderPath = oldPath.substring(
        oldPath.indexOf(':') + 2,
        oldPath.length,
      );
      const newFolderPath = `${oldPath.substring(
        oldPath.indexOf(':') + 2,
        oldPath.lastIndexOf('>') + 1,
      )}${newName}`;

      await this.storage.renameApptrayFolder(
        uid,
        drive,
        folderPath,
        newFolderPath,
      );

      const filePath = oldPath.split('>');

      // Update the folder tree with the new name
      userFiles.tree = JSON.stringify(
        this.renameFolderInTree(tree, filePath, newName),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteFile(path: string, uid: string): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (path.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + path,
          HttpStatus.BAD_REQUEST,
        );
      }

      const folderPath = path.substring(0, path.lastIndexOf('>')).split('>');
      const fileName = path.substring(path.lastIndexOf('>') + 1, path.length);

      // The modified file path for GCP Storage
      const storagePath = `${path.substring(
        0,
        path.indexOf(':') + 1,
      )}/${path.substring(path.indexOf(':') + 2, path.length)}`;

      //Delete file
      await this.storage.deleteFile(`apptray/${uid}/${storagePath}`);

      // Update the file tree with the new added file
      userFiles.tree = JSON.stringify(
        this.deleteFileInTree(tree, folderPath, fileName),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteFolder(path: string, uid: string): Promise<void> {
    try {
      const userFiles = await this.getUserFiles(uid);

      const tree: FolderNode = JSON.parse(userFiles.tree);

      // Checks for 2 or more occurrences of '>'
      if (path.includes('>>')) {
        throw new HttpException(
          'Invalid Path: ' + path,
          HttpStatus.BAD_REQUEST,
        );
      }
      //Delete any file's names that start with path
      await this.storage.deleteApptrayFolder(path, uid);

      // Remove '>' from the end of path
      path = path.substring(0, path.length - 1);

      const folderPath = path.split('>');

      // Update the file tree with the removed folder
      userFiles.tree = JSON.stringify(
        this.deleteFolderInTree(tree, folderPath),
      );

      await userFiles.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  private createFileInTree(
    fileTree: FolderNode,
    filePath: string[],
    file: FileNode,
  ): FolderNode {
    // If nested at the correct path the we add file to the files
    if (filePath.length === 0) {
      for (let i = 0; i < fileTree.files.length; i++) {
        if (fileTree.files[i].fileName === file.fileName) {
          fileTree.files[i] = file;
          return fileTree;
        }
      }
      fileTree.files.push(file);

      return fileTree;
    }

    // Runs to add folder if the parent folder exists.
    for (let i = 0; i < fileTree.folders.length; i++) {
      if (fileTree.folders[i].folderName === filePath[0]) {
        filePath.shift();

        fileTree.folders[i] = this.createFileInTree(
          fileTree.folders[i],
          filePath,
          file,
        );

        return fileTree;
      }
    }

    // Runs if no parent folder was found then adds the parent folder.
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

        fileTree.folders[i] = this.createFileInTree(
          fileTree.folders[i],
          filePath,
          file,
        );

        break;
      }
    }
    return fileTree;
  }

  private createFolderInTree(
    fileTree: FolderNode,
    filePath: string[],
    folder: FolderNode,
  ): FolderNode {
    // If nested at the correct path the we add file to the files
    if (filePath.length === 0) {
      for (let i = 0; i < fileTree.folders.length; i++) {
        if (fileTree.folders[i].folderName === folder.folderName) {
          fileTree.folders[i] = folder;
          return fileTree;
        }
      }
      fileTree.folders.push(folder);

      return fileTree;
    }

    // Runs to add folder if the parent folder exists.
    for (let i = 0; i < fileTree.folders.length; i++) {
      if (fileTree.folders[i].folderName === filePath[0]) {
        filePath.shift();

        fileTree.folders[i] = this.createFolderInTree(
          fileTree.folders[i],
          filePath,
          folder,
        );

        return fileTree;
      }
    }

    // Runs if no parent folder was found then adds the parent folder.
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

        fileTree.folders[i] = this.createFolderInTree(
          fileTree.folders[i],
          filePath,
          folder,
        );

        break;
      }
    }
    return fileTree;
  }

  private renameFileInTree(
    fileTree: FolderNode,
    filePath: string[],
    oldName: string,
    newName: string,
  ): FolderNode {
    // If nested at the correct path the we add file to the files
    if (filePath.length === 0) {
      for (let i = 0; i < fileTree.files.length; i++) {
        if (fileTree.files[i].fileName === oldName) {
          fileTree.files[i].fileName = newName;
          return fileTree;
        }
      }
      throw new HttpException(
        'Invalid Name: ' + oldName,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Runs to add folder if the parent folder exists.
    if (filePath.length > 0) {
      for (let i = 0; i < fileTree.folders.length; i++) {
        if (fileTree.folders[i].folderName === filePath[0]) {
          filePath.shift();

          fileTree.folders[i] = this.renameFileInTree(
            fileTree.folders[i],
            filePath,
            oldName,
            newName,
          );

          return fileTree;
        }
      }
      throw new HttpException(
        'Invalid Name: ' + oldName,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Runs if no parent folder was found then adds the parent folder.
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

        fileTree.folders[i] = this.renameFileInTree(
          fileTree.folders[i],
          filePath,
          oldName,
          newName,
        );

        return fileTree;
      }
    }
    throw new HttpException('Invalid Name: ' + oldName, HttpStatus.BAD_REQUEST);
  }

  private renameFolderInTree(
    fileTree: FolderNode,
    filePath: string[],
    newName: string,
  ): FolderNode {
    // If nested at the correct path the we add file to the files
    if (filePath.length === 1) {
      for (let i = 0; i < fileTree.folders.length; i++) {
        if (fileTree.folders[i].folderName === filePath[0]) {
          fileTree.folders[i].folderName = newName;
          return fileTree;
        }
      }
      throw new HttpException(
        'Invalid Name: ' + filePath[0],
        HttpStatus.BAD_REQUEST,
      );
    }

    // Runs to add folder if the parent folder exists.
    if (filePath.length > 1) {
      for (let i = 0; i < fileTree.folders.length; i++) {
        if (fileTree.folders[i].folderName === filePath[0]) {
          filePath.shift();

          fileTree.folders[i] = this.renameFolderInTree(
            fileTree.folders[i],
            filePath,
            newName,
          );

          return fileTree;
        }
      }
      throw new HttpException(
        'Invalid Name: ' + filePath[0],
        HttpStatus.BAD_REQUEST,
      );
    }

    // Runs if no parent folder was found then adds the parent folder.
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

        fileTree.folders[i] = this.renameFolderInTree(
          fileTree.folders[i],
          filePath,
          newName,
        );

        return fileTree;
      }
    }
    throw new HttpException(
      'Invalid Name: ' + filePath[0],
      HttpStatus.BAD_REQUEST,
    );
  }

  private deleteFileInTree(
    fileTree: FolderNode,
    filePath: string[],
    fileName: string,
  ): FolderNode {
    // If nested at the correct path the we remove file from the files
    if (filePath.length === 0) {
      fileTree.files = fileTree.files.filter(
        (file) => file.fileName !== fileName,
      );

      return fileTree;
    }

    for (let i = 0; i < fileTree.folders.length; i++) {
      if (fileTree.folders[i].folderName === filePath[0]) {
        filePath.shift();

        fileTree.folders[i] = this.deleteFileInTree(
          fileTree.folders[i],
          filePath,
          fileName,
        );

        break;
      }
    }

    return fileTree;
  }

  private deleteFolderInTree(
    fileTree: FolderNode,
    folderPath: string[],
  ): FolderNode {
    // If nested at the correct path the we delete that folder
    if (folderPath.length === 1) {
      fileTree.folders = fileTree.folders.filter(
        (folder) => folder.folderName !== folderPath[0],
      );

      return fileTree;
    }

    for (let i = 0; i < fileTree.folders.length; i++) {
      if (fileTree.folders[i].folderName === folderPath[0]) {
        folderPath.shift();

        fileTree.folders[i] = this.deleteFolderInTree(
          fileTree.folders[i],
          folderPath,
        );

        break;
      }
    }

    return fileTree;
  }
}
