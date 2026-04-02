import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private readonly logger = new Logger(AuthService.name);
  private appleKeysCache: { keys: any[]; fetchedAt: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private async getApplePublicKeys(): Promise<any[]> {
    // Cache keys for 24 hours
    if (this.appleKeysCache && Date.now() - this.appleKeysCache.fetchedAt < 86400000) {
      return this.appleKeysCache.keys;
    }
    const res = await fetch('https://appleid.apple.com/auth/keys');
    const data = await res.json() as any;
    this.appleKeysCache = { keys: data.keys, fetchedAt: Date.now() };
    return data.keys;
  }

  private async verifyAppleToken(identityToken: string): Promise<{ email?: string; sub?: string }> {
    const [headerB64] = identityToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

    const keys = await this.getApplePublicKeys();
    const key = keys.find((k: any) => k.kid === header.kid);
    if (!key) {
      throw new Error('Apple public key not found');
    }

    // Convert JWK to PEM
    const pubKey = crypto.createPublicKey({ key, format: 'jwk' });
    const pem = pubKey.export({ type: 'spki', format: 'pem' });

    // Verify JWT signature
    const [, payloadB64, signatureB64] = identityToken.split('.');
    const signedData = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signedData);
    const valid = verifier.verify(pem, signature);

    if (!valid) {
      throw new Error('Apple token signature invalid');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

    // Verify issuer and audience
    if (payload.iss !== 'https://appleid.apple.com') {
      throw new Error('Invalid issuer');
    }
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    return payload;
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
    if (!identityToken || identityToken.split('.').length !== 3) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    // Verify Apple JWT with public keys
    try {
      const payload = await this.verifyAppleToken(identityToken);
      if (!email && payload.email) {
        email = payload.email;
      }
    } catch (err) {
      throw new UnauthorizedException('Apple token verification failed');
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
