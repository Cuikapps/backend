/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { UserCreateDto } from './Dto/userCreate.dto';
import * as bcrypt from 'bcrypt';
import { UserUpdateDto } from './Dto/userUpdate.dto';
import { UserDto } from './Dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Users') private readonly usersModel: Model<UserDocument>,
  ) {}

  /**
   *
   * hashes the password to create document of user
   */
  async createUser(userData: UserCreateDto): Promise<UserDocument> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = new this.usersModel({
        email: userData.email,
        emailVerified: false,
        displayName: userData.displayName || this.emailToName(userData.email),
        photoURL: 'No Image',
        password: hashedPassword,
      });

      return await newUser.save();
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.CONFLICT);
    }
  }

  async userByEmail(email: string): Promise<UserDocument> {
    try {
      const user = await this.usersModel.findOne({ email });

      if (!user) {
        throw new HttpException('Failed to get User', HttpStatus.CONFLICT);
      } else {
        return user;
      }
    } catch (error) {
      throw new HttpException('Failed to get User', HttpStatus.BAD_REQUEST);
    }
  }

  async usersByName(name: string): Promise<UserDocument[]> {
    try {
      const users = await this.usersModel.find({ displayName: name });

      if (!users) {
        throw new HttpException('Failed to get User', HttpStatus.CONFLICT);
      } else {
        return users;
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async userById(id: string): Promise<UserDocument> {
    try {
      const users = await this.usersModel.findById(id);

      if (!users) {
        throw new HttpException('Failed to get User', HttpStatus.CONFLICT);
      } else {
        return users;
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async updateUser(
    userId: string,
    userData: UserUpdateDto,
  ): Promise<UserDocument> {
    try {
      const user = await this.usersModel.findById(userId);

      if (user) {
        user.displayName = userData.displayName ?? user.displayName;
        user.photoURL = userData.photoURL ?? user.photoURL;

        return await user.save();
      } else {
        throw new HttpException("Couldn't get user", HttpStatus.CONFLICT);
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.usersModel.findById(userId);

      if (user) {
        await user.delete();
      } else {
        throw new HttpException("Couldn't get user", HttpStatus.CONFLICT);
      }
    } catch (error) {
      throw new HttpException(error as string, HttpStatus.BAD_REQUEST);
    }
  }

  emailToName(email: string): string {
    return email.split('@')[0];
  }

  toSimpleUser(user: UserDocument): UserDto {
    return {
      uid: user._id,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }
}
