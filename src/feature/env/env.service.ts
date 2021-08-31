/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
  get Root(): string {
    return process.env.APP_ROOT;
  }

  get Dev(): boolean {
    return process.env.DEV ? true : false;
  }
}
