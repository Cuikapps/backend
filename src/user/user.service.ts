/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/schemas/user.schema';
import { userCreateDto } from './Dto/userCreate.dto';
import * as bcrypt from 'bcrypt';
import { userUpdateDto } from './Dto/userUpdate.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Users') private readonly usersModel: Model<UserDocument>,
  ) {}

  async createUser(userData: userCreateDto): Promise<UserDocument | null> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await new this.usersModel({
      email: userData.email,
      emailVerified: false,
      displayName: userData.displayName ?? this.emailToName(userData.email),
      photoURL: userData.photoURL ?? 'No Image',
      password: hashedPassword,
    });

    try {
      return await newUser.save();
    } catch (error) {
      return null;
    }
  }

  async userByEmail(email: string): Promise<UserDocument | null> {
    try {
      const user = await this.usersModel.findOne({ email });

      if (!user) {
        return null;
      } else {
        return user;
      }
    } catch (error) {
      return null;
    }
  }

  async usersByName(name: string): Promise<UserDocument[] | null> {
    try {
      const users = await this.usersModel.find({ displayName: name });

      if (!users) {
        return null;
      } else {
        return users;
      }
    } catch (error) {
      return null;
    }
  }

  async userById(id: string): Promise<UserDocument | undefined> {
    try {
      const users = await this.usersModel.findById(id);

      if (!users) {
        return null;
      } else {
        return users;
      }
    } catch (error) {
      return null;
    }
  }

  async updateUser(
    userId: string,
    userData: userUpdateDto,
  ): Promise<UserDocument | undefined> {
    const user = await this.usersModel.findById(userId);

    user.displayName = userData.displayName ?? user.displayName;
    user.password = userData.password ?? user.password;
    user.photoURL = userData.photoURL ?? user.photoURL;

    try {
      return await user.save();
    } catch (error) {
      return null;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.usersModel.findById(userId);

    try {
      await user.delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  emailToName(email: string): string {
    return email.split('@')[0];
  }
}
