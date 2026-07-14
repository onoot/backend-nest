import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentManager } from '../../common/decorators/manager.decorator';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Public()
  @Post('auth/login')
  async login(@Body() body: { username: string; password: string }) {
    try {
      return await this.authService.login(body.username, body.password);
    } catch (e) {
      this.logger.error('Login failed', e);
      throw e;
    }
  }

  @UseGuards(AuthGuard)
  @Get('manager/profile')
  async getProfile(@CurrentManager('sub') managerId: number) {
    return this.authService.getProfile(managerId);
  }

  @UseGuards(AuthGuard)
  @Post('manager/create')
  async createManager(@Body() body: { username: string; password: string }) {
    return this.authService.createManager(body.username, body.password);
  }

  @UseGuards(AuthGuard)
  @Post('manager/update-password')
  async updatePassword(
    @CurrentManager('sub') managerId: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.updatePassword(managerId, body.currentPassword, body.newPassword);
  }
}
