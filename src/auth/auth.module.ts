import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { PendingPasswordSchema } from '../schemas/pending-password.schema';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    MulterModule,
    MongooseModule.forFeature(
      [
        {
          name: 'PendingPassword',
          schema: PendingPasswordSchema,
          collection: 'pending-password-verification',
        },
      ],
      'Users',
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
