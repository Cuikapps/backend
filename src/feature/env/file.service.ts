/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

import * as admin from 'firebase-admin';

@Injectable()
export class FileService {
  readFromGCP(path: string): Promise<Buffer> {
    const data: Buffer[] = [];

    return new Promise((resolve, reject) => {
      admin
        .storage()
        .bucket()
        .file(path)
        .createReadStream()
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
  }
}
