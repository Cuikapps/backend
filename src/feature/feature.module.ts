/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { CookieService } from './cookie/cookie.service';
import { EnvService } from './env/env.service';
import { StorageService } from './storage/storage.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EnvService, StorageService, CookieService],
  exports: [EnvService, StorageService, CookieService],
})
export class FeatureModule {}
