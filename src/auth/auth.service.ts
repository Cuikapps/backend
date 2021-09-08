/*
https://docs.nestjs.com/providers#services
*/

import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { UserService } from '../user/user.service';

import * as bcrypt from 'bcrypt';
import * as sgMail from '@sendgrid/mail';
import { UserDocument } from '../schemas/user.schema';
import { sgApiKey } from '../sendgrid';
import * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PendingPasswordDocument } from '../schemas/pending-password.schema';
import { EnvService } from '../feature/env/env.service';
import { UserPassResetDto } from '../user/Dto/userPassReserDto';
import { FileService } from '../feature/env/file.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    @InjectModel('PendingPassword')
    private readonly pendingPasswordModel: Model<PendingPasswordDocument>,
    private readonly env: EnvService,
    private readonly file: FileService,
  ) {
    this.pendingPasswordModel.createIndexes();
  }

  async signIn(email: string, password: string): Promise<string> {
    const user = await this.users.userByEmail(email);

    if (bcrypt.compare(password, user.password)) {
      return await this.genAccessToken(email);
    } else {
      throw new HttpException(
        'Wrong Email of Password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async genAccessToken(email: string): Promise<string> {
    const user = await this.users.userByEmail(email);

    const token = await bcrypt.hash(user._id + user.password, 2);

    const expireDate = new Date();

    expireDate.setMonth(expireDate.getMonth() + 1);

    return `${user._id}-${token}-${expireDate.getTime().toString()}`;
  }

  async signUp(email: string, password: string): Promise<void> {
    const newUser = await this.users.createUser({ email, password });

    if (newUser) {
      await this.verifyUserEmail(newUser);
    } else {
      throw new HttpException('User Not Created', HttpStatus.BAD_REQUEST);
    }
  }

  async signUpWithName(
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    const newUser = await this.users.createUser({
      email,
      password,
      displayName,
    });

    if (newUser) {
      await this.verifyUserEmail(newUser);
    } else {
      throw new HttpException('User Not Created', HttpStatus.BAD_REQUEST);
    }
  }

  async deleteAccount(email: string, password: string): Promise<void> {
    const user = await this.users.userByEmail(email);

    if (bcrypt.compare(password, user.password)) {
      this.users.deleteUser(user._id);
    } else {
      throw new HttpException('User Not Deleted', HttpStatus.BAD_REQUEST);
    }
  }

  async uploadUserPhoto(
    fileBuffer: string,
    name: string,
    ext: string,
  ): Promise<void> {
    try {
      const uid = name.split('.')[0];

      const file = admin.storage().bucket().file(`profileImages/${name}`);
      console.log('File Created');

      // Update user profile image link
      const user = await this.users.userById(uid);
      console.log('Got user');

      const buffer = Buffer.from(fileBuffer, 'binary');

      await file.save(buffer, {
        contentType: 'image/' + ext,
        gzip: false,
        public: false,
      });
      console.log('File Saved');

      // The file upload is complete
      user.photoURL = `${this.env.Root}/auth/get-profile-image/${name}`;

      await user.save();
      console.log('User updated');
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserImage(imgName: string): Promise<StreamableFile> {
    try {
      const fileBuffer = await this.file.readFromGCP(
        `profileImages/${imgName}`,
      );

      return new StreamableFile(fileBuffer);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async resetPassword(userPassReset: UserPassResetDto, authToken: string) {
    sgMail.setApiKey(sgApiKey);

    const user = await this.users.userById(authToken.split('-')[0]);

    const pending = new this.pendingPasswordModel({
      email: userPassReset.email,
      newPassword: userPassReset.newPassword,
      //Expires after a day.
      expire: new Date(Date.now() + 86400).getTime(),
    });

    await pending.save();

    const token = pending._id;

    const msg: sgMail.MailDataRequired = {
      to: userPassReset.email,
      from: 'cuikapps@gmail.com',
      subject: 'Reset Password | Cuikapps',
      text: 'Please verify that you want to change your password.',
      templateId: 'd-b2a72ffcf33a442cbff877b6b494e72f',
      dynamicTemplateData: {
        displayName: user.displayName,
        displayEmail: userPassReset.email,
        displayPassword: userPassReset.newPassword,
        confirmationURL: `${this.env.Root}/auth/confirm-password-reset?verification=${token}`,
      },
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(error);
    }
  }

  async verifyPasswordToken(token: string) {
    const pendingPass = await this.pendingPasswordModel.findById(token);
    if (Date.now() < pendingPass.expire) {
      const user = await this.users.userByEmail(pendingPass.email);

      user.password = await bcrypt.hash(pendingPass.newPassword, 10);

      pendingPass.remove();
    } else {
      throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
    }
  }

  async verifyUserEmail(user: UserDocument) {
    sgMail.setApiKey(sgApiKey);

    let token = user.email;

    token += '-' + new Date(Date.now() + 3599).getTime().toString();

    const msg: sgMail.MailDataRequired = {
      to: user.email,
      from: 'cuikapps@gmail.com',
      subject: 'Email Confirmation | Cuikapps',
      text: 'Please verify your email to complete account creation.',
      templateId: 'd-9e9a3af19d944ff1925c38594e91526a',
      dynamicTemplateData: {
        displayName: user.displayName,
        displayEmail: user.email,
        confirmationURL: `${this.env.Root}/auth/confirm-email-verification?verification=${token}`,
      },
    };
    try {
      await sgMail.send(msg, false, (err, res) => {
        if (err) {
          console.error(err);
        } else if (res) {
          console.log(res);
        }
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyConfirmationToken(token: string): Promise<boolean> {
    const splitToken = token.split('-');

    const email: string = splitToken[0];
    const expire: string = splitToken[1];

    const user = this.users.userByEmail(email);

    if (Date.now() < parseInt(expire) && user) {
      return true;
    } else {
      return false;
    }
  }

  async verifyUserToken(token: string): Promise<boolean> {
    const splitToken = token.split('-');

    const uid: string = splitToken[0];
    const access: string = splitToken[1];
    const expire: string = splitToken[2];

    if (Date.now() > parseInt(expire)) {
      return false;
    }
    const user = await this.users.userById(uid);

    if (bcrypt.compareSync(user._id + user.password, access)) {
      return true;
    } else {
      return false;
    }
  }
}
