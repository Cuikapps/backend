import { CookieService } from './feature/cookie/cookie.service';
import { FileUploadGateway } from './apptray/file-upload.gateway';
import { ApptrayModule } from './apptray/apptray.module';
import { FeatureModule } from './feature/feature.module';
import { NewsModule } from './news/news.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackModule } from './feedback/feedback.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ApptrayModule,
    FeatureModule,
    AuthModule,
    UserModule,
    NewsModule,
    FeedbackModule,
    MongooseModule.forRoot(
      process.env.UsersDB ||
        'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Users?retryWrites=true&w=majority',
      { connectionName: 'Users' },
    ),
    MongooseModule.forRoot(
      process.env.FeedbackDB ||
        'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Feedback?retryWrites=true&w=majority',
      { connectionName: 'Feedback' },
    ),
    MongooseModule.forRoot(
      process.env.ApptrayDB ||
        'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Apptray?retryWrites=true&w=majority',
      { connectionName: 'Apptray' },
    ),
    ThrottlerModule.forRoot({
      ttl: 5,
      limit: 50,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
