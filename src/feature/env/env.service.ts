/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
  get Root(): string {
    return process.env.APP_ROOT || 'http://localhost:3000/api';
  }

  get Dev(): boolean {
    return process.env.DEV ? true : false;
  }
}
