/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import * as admin from 'firebase-admin';
import * as JSZip from 'jszip';
import internal from 'stream';
import {
  applicationTypes,
  audioTypes,
  fontTypes,
  imageTypes,
  textTypes,
  videoTypes,
} from './fileTypes';

@Injectable()
export class StorageService {
  async uploadFile(
    path: string,
    fileBuffer: Uint8Array,
    type: string,
  ): Promise<void> {
    try {
      const file = admin.storage().bucket().file(path);

      const buffer = Buffer.from(fileBuffer);

      file.save(buffer, {
        contentType: type,
        gzip: true,
        public: false,
      });
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async continueUploadFile(
    path: string,
    fileBuffer: Uint8Array,
    type: string,
    writer?: internal.Writable,
  ): Promise<internal.Writable> {
    try {
      const file = admin.storage().bucket().file(path);
      const write = writer
        ? writer
        : file.createWriteStream({
            contentType: type,
            gzip: true,
            public: false,
            resumable: true,
          });

      await new Promise<void>((resolve, reject) => {
        write.once('error', (error) => {
          write.removeAllListeners();
          reject(error);
        });
        write.write(fileBuffer, () => {
          write.removeAllListeners();
          resolve();
        });
      });

      return write;
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async readFile(path: string): Promise<Buffer> {
    try {
      const data: Buffer[] = [];

      return new Promise((resolve, reject) => {
        admin
          .storage()
          .bucket()
          .file(path)
          .createReadStream({ decompress: true })
          .on('data', (fileContents) => {
            data.push(fileContents);
          })
          .on('error', (error) => {
            reject(error);
          })
          .on('end', () => {
            resolve(Buffer.concat(data));
          });
      });
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async readApptrayFiles(
    uid: string,
    drive: string,
    folderPath: string,
    filesNames: string[],
  ): Promise<string> {
    try {
      const files = await admin
        .storage()
        .bucket()
        .getFiles({ prefix: `apptray/${uid}/${drive}/${folderPath}` });

      const waitingForDownload: Promise<[string, Buffer]>[] = [];

      for (const file of files[0]) {
        if (
          filesNames.includes(
            file.name
              .replace(`apptray/${uid}/${drive}/${folderPath}`, '')
              .replace(new RegExp('>.*'), '') + '/',
          ) ||
          filesNames.includes(
            file.name
              .replace(`apptray/${uid}/${drive}/${folderPath}`, '')
              .replace(new RegExp('>.*'), ''),
          )
        ) {
          const data: Buffer[] = [];

          waitingForDownload.push(
            new Promise((resolve, reject) => {
              file
                .createReadStream({ decompress: true })
                .on('data', (fileContents: Buffer) => {
                  data.push(fileContents);
                })
                .on('error', (error) => {
                  reject(error);
                })
                .on('end', () => {
                  resolve([file.name, Buffer.concat(data)]);
                });
            }),
          );
        }
      }

      let downloadedFiles = await Promise.all(waitingForDownload);

      downloadedFiles = downloadedFiles.map((v) => {
        return [
          v[0]
            .replace(`apptray/${uid}/${drive}/${folderPath}`, '')
            .replace(new RegExp('>'), '/'),
          v[1],
        ];
      });

      let archive = new JSZip();

      archive = archive.folder('downloads') as JSZip;

      for (const downloadedFile of downloadedFiles) {
        archive.file(downloadedFile[0], downloadedFile[1].toString('binary'), {
          binary: true,
          createFolders: true,
        });
      }

      return await archive.generateAsync({ type: 'binarystring' });
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async renameFile(
    uid: string,
    drive: string,
    oldName: string,
    newName: string,
  ): Promise<void> {
    try {
      const newPath =
        oldName.substring(0, oldName.lastIndexOf('>') + 1) + newName;
      const fileExt = newName.substring(
        newName.lastIndexOf('.') + 1,
        newName.length,
      );

      const newContentType = this.getContentType(fileExt);

      const files = await admin
        .storage()
        .bucket()
        .getFiles({ prefix: `apptray/${uid}/${drive}` });

      for (const file of files[0]) {
        if (file.name === `apptray/${uid}/${drive}/${oldName}`) {
          const [metadata] = await file.getMetadata();

          metadata.contentType = newContentType;

          await file.setMetadata(metadata);
          await file.rename(`apptray/${uid}/${drive}/${newPath}`);
          break;
        }
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async renameApptrayFolder(
    uid: string,
    drive: string,
    folderPath: string,
    newFolderPath: string,
  ): Promise<void> {
    try {
      const files = await admin
        .storage()
        .bucket()
        .getFiles({ prefix: `apptray/${uid}/${drive}` });

      for (const file of files[0]) {
        if (file.name.startsWith(`apptray/${uid}/${drive}/${folderPath}>`)) {
          const newFileName = `apptray/${uid}/${drive}/${newFolderPath}${file.name.substring(
            `apptray/${uid}/${drive}/${folderPath}`.length,
            file.name.lastIndexOf('>'),
          )}${file.name.substring(
            file.name.lastIndexOf('>'),
            file.name.length,
          )}`;

          await file.rename(newFileName);
        }
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const file = admin.storage().bucket().file(path);

      await file.delete();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async deleteApptrayFolder(path: string, uid: string): Promise<void> {
    try {
      const storagePath = `${path.substring(
        0,
        path.indexOf(':') + 1,
      )}/${path.substring(path.indexOf(':') + 2, path.length)}`;

      const res = await admin
        .storage()
        .bucket()
        .getFiles({ prefix: `apptray/${uid}/${storagePath}` });

      for (const file of res[0]) {
        if (file.name.startsWith(`apptray/${uid}/${storagePath}`)) {
          await file.delete();
        }
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  getContentType(ext: string): string {
    if (audioTypes.includes(ext)) {
      return 'audio/*';
    } else if (videoTypes.includes(ext)) {
      return 'video/*';
    } else if (imageTypes.includes(ext)) {
      return 'image/*';
    } else if (textTypes.includes(ext)) {
      return 'text/*';
    } else if (fontTypes.includes(ext)) {
      return 'font/*';
    } else if (applicationTypes.includes(ext)) {
      return 'application/*';
    } else {
      return 'other';
    }
  }
}
