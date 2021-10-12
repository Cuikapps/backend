/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import * as admin from 'firebase-admin';

@Injectable()
export class StorageService {
  async uploadFile(
    path: string,
    fileBuffer: string,
    type: string,
  ): Promise<void> {
    try {
      const file = admin.storage().bucket().file(path);

      const buffer = Buffer.from(fileBuffer, 'binary');

      await file.save(buffer, {
        contentType: type,
        gzip: true,
        public: false,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.CONFLICT);
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
      throw new HttpException(error, HttpStatus.CONFLICT);
    }
  }

  async renameFile(
    uid: string,
    oldName: string,
    newName: string,
  ): Promise<void> {
    await admin
      .storage()
      .bucket()
      .file(`apptray/${uid}/${oldName}`)
      .rename(`apptray/${uid}/${newName}`);
  }

  async renameApptrayFolder(
    uid: string,
    drive: string,
    folderPath: string,
    newFolderPath: string,
  ): Promise<void> {
    const files = await admin
      .storage()
      .bucket()
      .getFiles({ prefix: `apptray/${uid}/${drive}` });

    for (const file of files[0]) {
      if (file.name.startsWith(`apptray/${uid}/${drive}/${folderPath}`)) {
        const newFileName = `apptray/${uid}/${drive}/${newFolderPath}${file.name.substring(
          file.name.lastIndexOf('>'),
          file.name.length,
        )}`;

        file.rename(newFileName);
      }
    }
  }

  async deleteFile(path: string): Promise<void> {
    const file = admin.storage().bucket().file(path);

    await file.delete();
  }

  async deleteApptrayFolder(path: string, uid: string): Promise<void> {
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
  }
}
