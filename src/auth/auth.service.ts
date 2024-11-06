import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';
import { AdminSigninDto } from './dto/admin-signin.dto';
import { Admin } from '../admin/models/admin.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateClientDto } from '../client/dto/create-client.dto';
import { ClientService } from '../client/client.service';
import Client from '../client/models/client.model';
import * as uuid from 'uuid';
import { MailService } from '../mail/mail.service';
import { ClientSigninDto } from './dto/client-signin.dto';
import { config } from 'process';
import { compare, hash } from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { JwtPayload } from 'jsonwebtoken';
import { Tokens } from '../common/types/tokens.type';
import { ResponseFields } from '../common/types/response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    @InjectModel(Admin) private adminModel: typeof Admin,
    @InjectModel(Client) private clientModel: typeof Client,
    private readonly clientService: ClientService,
    private readonly mailService: MailService,
  ) {}

  // -------------------------------Admin--------------------------------
  
  async updateRefreshToken(userId: number, refresh_token: string) {
    const hashed_refresh_token = await hash(refresh_token, 7);
    await this.adminModel.update(
      { refresh_token: hashed_refresh_token },
      { where: { id: userId } },
    );
  }

  async generateToken(admin: Admin) {
    const payload = {
      id: admin.id,
      email: admin.email,
      is_creator: admin.is_creator,
    };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async handleRefreshToken(refreshToken: string, res: Response) {
    try {
      const payload = await this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_KEY,
      });
      const admin = await this.adminService.findByEmail(payload.email);
      if (!admin) {
        throw new BadRequestException('Invalid refresh token');
      }

      const validRefreshToken = await bcrypt.compare(
        refreshToken,
        admin.refresh_token,
      );

      if (!validRefreshToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateToken(admin);
      await this.updateRefreshToken(admin.id, tokens.refresh_token);
      res.cookie('refresh_token', tokens.refresh_token, {
        maxAge: +process.env.COOKIE_TIME,
        httpOnly: true,
      });

      return {
        message: 'Token refreshed successfully',
        id: admin.id,
        access_token: tokens.access_token,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }


  async signIn(signInAdminDto: AdminSigninDto, res: Response) {
    const { email, password } = signInAdminDto;
    const admin = await this.adminService.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }
    const tokens = await this.generateToken(admin);
    await this.updateRefreshToken(admin.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: +process.env.COOKIE_TIME,
      httpOnly: true,
      });
    return tokens;
  }

  async adminSignOut(refresh_token: string, res: Response) {
    const decodedToken = this.jwtService.verify(refresh_token, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    const admin = await this.adminService.findOne(decodedToken.id);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    admin.refresh_token = null;
    await admin.save();
    res.clearCookie('refresh_token');
    return admin;
  }

  // -------------------------------Client--------------------------------

  async generateTokenClient(user: Client) {
    const payload = {
      id: user.id,
      email: user.email,
      is_active: user.is_active,
    };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async updateClientRefreshToken(clientId: number, refresh_token: string) {
    const hashed_refresh_token = await bcrypt.hash(refresh_token, 7);
    await this.clientModel.update(
      { refresh_token: hashed_refresh_token },
      { where: { id: clientId } },
    );
  }

  async refreshTokenClient(refresh_token: string, res: Response, id: number) {
    const payload = await this.jwtService.verify(refresh_token, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    console.log(payload);
    const client = await this.clientService.findOne(payload.id);
    console.log(client);
    if (!client) {
      throw new UnauthorizedException('Client not found');
    }
    if (id !== client.id) {
      throw new BadRequestException('This another client');
    }
    console.log(client.refresh_token);
    const valid_refresh_token = await bcrypt.compare(
      refresh_token,
      client.refresh_token,
    );
    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    if (!valid_refresh_token) {
      throw new UnauthorizedException("So'rovda xatolik");
    }
    const tokens = await this.generateTokenClient(client);
    await this.updateClientRefreshToken(client.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: +process.env.REFRESH_TIME_MS,
    });
    return tokens;
  }

  async clientSignUp(createClientDto: CreateClientDto, res: Response) {
    const client = await this.clientService.findByEmail(createClientDto.email);
    if (client) {
      throw new BadRequestException('Client already exists');
    }

    if (createClientDto.password !== createClientDto.confirm_password) {
      throw new BadRequestException('Password is not match');
    }
    const hashed_password = await bcrypt.hash(createClientDto.password, 7);
    const newClient = await this.clientModel.create({
      ...createClientDto,
      password: hashed_password,
    });
    const tokens = await this.generateTokenClient(newClient);
    const hashed_refresh_token = await bcrypt.hash(tokens.refresh_token, 7);
    const activation_link = uuid.v4();
    const updatedClient = await this.clientModel.update(
      {
        refresh_token: hashed_refresh_token,
        activation_link,
      },
      {
        where: { id: newClient.id },
        returning: true,
      },
    );
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: +process.env.REFRESH_TIME_MS,
    });

    console.log(updatedClient[1][0]);

    try {
      await this.mailService.sendMail(updatedClient[1][0]);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Xat yuborishda xatolik');
    }

    const response = {
      message: 'User registered',
      user: updatedClient[1][0],
      access_token: tokens.access_token,
    };
    return response;
  }

  async clientSignIn(signInClientDto: ClientSigninDto, res: Response) {
    const client = await this.clientService.findByEmail(signInClientDto.email);
    if (!client) {
      throw new UnauthorizedException('Client not found');
    }
    const isMatch = await bcrypt.compare(
      signInClientDto.password,
      client.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }
    const tokens = await this.generateTokenClient(client);
    return tokens;
  }

  async clientSignOut(refresh_token: string, res: Response) {
    const decodedToken = this.jwtService.verify(refresh_token, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    const user = await this.clientModel.findOne({
      where: { id: decodedToken.id },
    });
    const updatedUser = await this.clientModel.update(
      {
        refresh_token: null,
      },
      {
        where: { id: user.id },
      },
    );
    res.clearCookie('refresh_token');
    return updatedUser;
  }

  async activateClient(link: string) {
    if (!link) {
      throw new BadRequestException('Activation link not found');
    }
    const updateClient = await this.clientModel.update(
      { is_active: true },
      {
        where: {
          activation_link: link,
          is_active: false,
        },
        returning: true,
      },
    );
    if (!updateClient[1][0]) {
      throw new BadRequestException('Client already activated');
    }
    const response = {
      message: 'Client activated successfully',
      client: updateClient[1][0].is_active,
    };
    return response;
  }
}
