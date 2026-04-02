import { Controller, Post, Get, Body, Req, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseService } from './purchase.service';

@Controller('purchase')
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async recordPurchase(@Req() req: any, @Body() body: {
    productId: string;
    platform: string;
    price: number;
    currency?: string;
    transactionId?: string;
    receipt?: string;
  }) {
    return this.purchaseService.recordPurchase(req.user.id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async getHistory(@Req() req: any) {
    return this.purchaseService.getUserPurchases(req.user.id);
  }

  // Admin endpoint - requires ADMIN_API_KEY
  @Get('admin/revenue')
  async getRevenueStats(@Headers('x-admin-key') adminKey: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || adminKey !== expected) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return this.purchaseService.getRevenueStats();
  }
}
