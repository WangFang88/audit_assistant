import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { AuthService, LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  me() {
    return this.authService.me();
  }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(dto);
  }
}
