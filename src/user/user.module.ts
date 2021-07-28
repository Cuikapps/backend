import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: 'Users',
          schema: UserSchema,
          collection: 'user-data',
        },
      ],
      'Users',
    ),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
