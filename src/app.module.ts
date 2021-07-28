import { NewsModule } from './news/news.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackModule } from './feedback/feedback.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    NewsModule,
    FeedbackModule,
    MongooseModule.forRoot(
      'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Users?retryWrites=true&w=majority',
      { connectionName: 'Users' },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Feedback?retryWrites=true&w=majority',
      { connectionName: 'Feedback' },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://cuikapps-db:Vu5lA4BeL0BHrv91@mytestdb.8f5px.mongodb.net/Apptray?retryWrites=true&w=majority',
      { connectionName: 'Apptray' },
    ),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
