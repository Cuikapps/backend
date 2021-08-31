/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EnvService } from './env/env.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EnvService],
  exports: [EnvService],
})
export class FeatureModule {}
