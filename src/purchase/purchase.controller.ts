import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
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
  }) {
    return this.purchaseService.recordPurchase(req.user.id, body);
  }

  // Admin endpoint (no auth for now — admin uses separate auth)
  @Get('admin/revenue')
  async getRevenueStats() {
    return this.purchaseService.getRevenueStats();
  }
}
