"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwt;
    googleClient;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }
    async googleLogin(idToken) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid Google token');
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
                    weight: 70,
                    goalMl: 2300,
                },
            });
        }
        const token = this.jwt.sign({ sub: user.id, email: user.email });
        return { token, user, isNewUser };
    }
    async appleLogin(identityToken, email, fullName) {
        let user = email
            ? await this.prisma.user.findUnique({ where: { email } })
            : null;
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
            throw new common_1.UnauthorizedException('Apple login failed');
        }
        const token = this.jwt.sign({ sub: user.id, email: user.email });
        return { token, user, isNewUser };
    }
    async devLogin(email) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map