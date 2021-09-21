/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EnvService } from './env/env.service';
import { StorageService } from './storage/storage.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EnvService, StorageService],
  exports: [EnvService, StorageService],
})
export class FeatureModule {}
