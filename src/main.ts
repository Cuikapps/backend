import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as firebaseAdmin from 'firebase-admin';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

const privateKey =
  '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQChqKFJzZjqp8Kq\nP9gBnUW9gfPJMb2Dp0vejv5hd1r/pBHOgLnB0Qb1O6y8oX8P82DKY2TbGiomTYWW\ng+WXKrzNBb/Vbw1DYhY96wYPmi0vyK+XqBKImhM2xep60CXHnISB9M/yXZQBf8vr\nBk6Jcpqb++pbckP0I7Jvuq1PGVKxtn/DjJqXkJAKeAwVJjUSCiEHjputuR97imxA\nU1UmG1Bf70smHzsOgX8OEPACk91QmRIP39wvVrQWCIOEgGYMVGIyi2dkGLyzh9Sy\nj9ETk7t2Ln4tFv8C1aI3tXYZYfursk1dY8sxtsDe8OMJDru8z76TC8dkzMQqX3Kz\nU26NJqeNAgMBAAECggEACbRcFFhjjuipwrso7jXhByabOi+CezoKj66BXlwCKjkQ\n+ZbYL+aqtoOR09QVEuHPJG8xkYahU6HRPG8oE/pUkbE/6iHrx6kGgUqP11Vv03/G\nbMIB9NHdB+t7L0q6DeDbQoruBdRwy2M+3FnJUq5+0hDeKYWzRx9yeYsZFtfEE1dz\nGVUYzKDwdCLXap3fXoZj5qTURr5yobjyBfo5rmqEfnpTbiXlsZIelQ4ycCb8VDPj\n/kHXd+pxF/93LcbpEt4hcgWLil7hqUsKJujcxZ8oNZF3EEykZ0UpVuhEuRhGhdpW\nvQ4+vyJxE8bI8l6OfuvVSN3X/mpdZL7gcd0+HZrR6QKBgQDaP4mGyAA5L6X1tRPI\nx7UOrwfBl//isO+ziGWoJymnkPaD0w7nx3yObfI6vm0kBKzf2RECPOfyiEseBJjs\nVJ4+qcfAXLopgf43/plUAsPkemABZ46xKGRo8iZQA5CL2j9dGXcW1nOv04S/KUAo\nmk7LM6C+6Y5vfKkxfDTwuiiqRQKBgQC9nzLH9SBAZp6lf6DP+88ZJLM8CtemOcEl\nOh3RIgDoZeVo/dV2wjl1GINWrl21diN1w1H8AqxgV/jkICHaQ0W+RqujQp7QFld2\nm6iOT2Wsadgb7k0osCBmcRmXk1I31W1egAR3wIOmj3D5KYv8HBbXYTtQTSagFkcF\nrV7xuRlAqQKBgDL2GR/evaacyKzaDneYol9+YVpEKtz9IcuTMuGT23ckM1vOwbE/\ndIcxhxlOc9+wM8nFPuJ95E9OofOtcSPmEllhfaIeRN4CW6EpkxX521ITfS12x+v4\nGZIj0OxoGK1/VcJget1bUAIjauDUOgYBGhr6wDM0CC1iN4O1lAsN/QbdAoGATuJr\nvcO8Jw6J8U+nFt8qyMr7xX69N+nO8C29OcNrnULGrWbr5vvl61DHUsg3M8Zx+gvH\nj4+NJodyg3TaoHJcEUxVGxYb+3VP7YfUF1/wbEmcHgKFFugukm96thQToCap2SZo\ntWjhW+lQllcyZS9KUU+h3UY7S135LeNyHB1k5AECgYA8CGEb9Le8eWivnXNPrRSo\nnEBxnLXW85bNMBAU1fYOzzGFEjQ3eyLbTq053E85i9Wh/cAdvfuhmsPl3Lm7+qGI\ns0s1TXMW6NXZhEAh8zXo/dNpJo/MNIvKr8zbv+YddqUdWWOvy0d/fHVh/DsiAvHT\nzD19ZP9883jJyIGZs6+c1A==\n-----END PRIVATE KEY-----\n';

const server = express();

server.get('/', (req, res) => {
  res.send('ok');
});
server.get('/_ah/health', (req, res) => {
  res.send('ok');
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: 'cuikapps',
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail: 'firebase-adminsdk-n09vh@cuikapps.iam.gserviceaccount.com',
    }),
    databaseURL: 'https://cuikapps-default-rtdb.firebaseio.com',
    storageBucket: 'cuikapps.appspot.com',
  });

  app.enableCors({
    origin: [
      'https://cuikapps.com',
      'https://www.cuikapps.com',
      'https://apptray.cuikapps.com',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  });
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
