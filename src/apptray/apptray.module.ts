import { ApptrayService } from './apptray.service';
import { ApptrayController } from './apptray.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FileTreeSchema } from '../schemas/fileTree.schema';
import { UserConfigSchema } from '../schemas/userConfig.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature(
      [
        {
          name: 'FileTree',
          schema: FileTreeSchema,
          collection: 'user-files',
        },
      ],
      'Apptray',
    ),
    MongooseModule.forFeature(
      [
        {
          name: 'UserConfig',
          schema: UserConfigSchema,
          collection: 'user-config',
        },
      ],
      'Apptray',
    ),
  ],
  controllers: [ApptrayController],
  providers: [ApptrayService],
  exports: [ApptrayService],
})
export class ApptrayModule {}
