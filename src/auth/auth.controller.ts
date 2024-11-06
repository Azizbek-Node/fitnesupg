import { Controller, Post, Body, Res, Param, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';
import { AdminSigninDto } from './dto/admin-signin.dto';
import { Response, Request } from 'express';
import { Admin } from '../admin/models/admin.model';
import { CreateClientDto } from '../client/dto/create-client.dto';
import { ClientSigninDto } from './dto/client-signin.dto';
import { Client } from '../client/models/client.model';
import { JwtPayloadWithRefreshToken } from '../common/types/jwt-payload-refresh.type';
import { GetCurentUser } from '../common/decorators/get-current-user.decorator';
import { ResponseFields } from '../common/types/response.type';
import { CookieGetter } from '../common/decorators/cookie-getter.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //-------------------------Admin----------------------------
  @ApiOperation({
    summary: 'Generate token',
    description: 'Generate token',
  })
  @Post('generate-token')
  async generateToken(@Body() admin: Admin) {
    return this.authService.generateToken(admin);
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh token',
  })
  @Post('refresh-token/:id')
  async handleRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true })

    res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    return this.authService.handleRefreshToken(refreshToken, res);
  }

  @Post('admin-signin')
  @ApiOperation({
    summary: 'Admin signin',
    description: 'Admin signin',
  })
  async adminSignin(
    @Body() signInAdminDto: AdminSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(signInAdminDto, res);
  }

  @Post('admin-signout')
  async adminSignout(
    @Body() refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminSignOut(refresh_token, res);
  }

  //-------------------------Client----------------------------

  @Post('refresh-token-client/:id')
  refreshTokenClient(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const refresh_token = req.cookies['refresh_token'];
    return this.authService.refreshTokenClient(refresh_token, res, +id);
  }

  @ApiOperation({
    summary: 'Generate token client',
    description: 'Generate token client',
  })
  @Post('generate-token-client')
  generateTokenClient(@Body() client: Client) {
    return this.authService.generateTokenClient(client);
  }

  @ApiOperation({
    summary: 'Client signup',
    description: 'Client signup',
  })
  @Post('client-signup')
  async clientSignup(
    @Body() createClientDto: CreateClientDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.clientSignUp(createClientDto, res);
  }

  @ApiOperation({
    summary: 'Client signin',
    description: 'Client signin',
  })
  @Post('client-signin')
  async clientSignin(
    @Body() signInClientDto: ClientSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.clientSignIn(signInClientDto, res);
  }

  @ApiOperation({
    summary: 'Client signout',
    description: 'Client signout',
  })
  @Post('client-signout')
  async clientSignout(
    @Body() refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.clientSignOut(refresh_token, res);
  }

  @ApiOperation({
    summary: 'Activate client',
    description: 'Activate client',
  })
  @Get('activate/:link')
  activateClient(@Param('link') link: string) {
    return this.authService.activateClient(link);
  }
}
