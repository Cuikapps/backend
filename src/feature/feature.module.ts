/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EnvService } from './env/env.service';
import { FileService } from './env/file.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [FileService, EnvService],
  exports: [FileService, EnvService],
})
export class FeatureModule {}
