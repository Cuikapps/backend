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

  async deleteFile(path): Promise<void> {
    const file = admin.storage().bucket().file(path);

    await file.delete();
  }
}
