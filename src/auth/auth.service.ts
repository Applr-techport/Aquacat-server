import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async googleLogin(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          provider: 'google',
          displayName: payload.name || null,
          weight: 70, // default, will be updated in onboarding
          goalMl: 2300, // 70 * 33
        },
      });
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user, isNewUser };
  }

  async appleLogin(identityToken: string, email?: string, fullName?: string) {
    // Basic JWT structure validation (MVP)
    // TODO: Full verification with Apple's public keys for production
    if (!identityToken || identityToken.split('.').length !== 3) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    // Decode payload to extract email if not provided
    try {
      const payload = JSON.parse(Buffer.from(identityToken.split('.')[1], 'base64').toString());
      if (!email && payload.email) {
        email = payload.email;
      }
    } catch {
      throw new UnauthorizedException('Failed to decode Apple token');
    }

    if (!email) {
      throw new UnauthorizedException('Email is required for Apple login');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    const isNewUser = !user;

    if (!user && email) {
      user = await this.prisma.user.create({
        data: {
          email,
          provider: 'apple',
          displayName: fullName || null,
          weight: 70,
          goalMl: 2300,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Apple login failed');
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user, isNewUser };
  }

  async devLogin(email: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          provider: 'dev',
          weight: 0,
          goalMl: 0,
        },
      });
    }
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user };
  }
}
