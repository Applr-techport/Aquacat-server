import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  async recordPurchase(userId: string, data: {
    productId: string;
    platform: string;
    price: number;
    currency?: string;
    transactionId?: string;
  }) {
    // Record purchase
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        productId: data.productId,
        platform: data.platform,
        price: data.price,
        currency: data.currency || 'KRW',
        transactionId: data.transactionId,
      },
    });

    // Update user premium status
    if (data.productId === 'remove_ads') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });
    }

    return purchase;
  }

  // Admin: revenue stats
  async getRevenueStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, todayRevenue, monthRevenue, totalPurchases, premiumUsers, recentPurchases] = await Promise.all([
      this.prisma.purchase.aggregate({
        where: { status: 'completed' },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.purchase.aggregate({
        where: { status: 'completed', purchasedAt: { gte: todayStart } },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.purchase.aggregate({
        where: { status: 'completed', purchasedAt: { gte: monthStart } },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.purchase.count({ where: { status: 'completed' } }),
      this.prisma.user.count({ where: { isPremium: true } }),
      this.prisma.purchase.findMany({
        where: { status: 'completed' },
        include: { user: { select: { displayName: true, email: true } } },
        orderBy: { purchasedAt: 'desc' },
        take: 50,
      }),
    ]);

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyPurchases = await this.prisma.purchase.findMany({
      where: { status: 'completed', purchasedAt: { gte: thirtyDaysAgo } },
      select: { price: true, purchasedAt: true },
      orderBy: { purchasedAt: 'asc' },
    });

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    for (const p of dailyPurchases) {
      const date = p.purchasedAt.toISOString().slice(0, 10);
      dailyRevenue[date] = (dailyRevenue[date] || 0) + p.price;
    }

    // Total users for conversion rate
    const totalUsers = await this.prisma.user.count();

    return {
      total: { revenue: totalRevenue._sum.price || 0, count: totalRevenue._count },
      today: { revenue: todayRevenue._sum.price || 0, count: todayRevenue._count },
      month: { revenue: monthRevenue._sum.price || 0, count: monthRevenue._count },
      premiumUsers,
      totalUsers,
      conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0',
      dailyRevenue,
      recentPurchases: recentPurchases.map(p => ({
        id: p.id,
        user: p.user.displayName || p.user.email,
        productId: p.productId,
        platform: p.platform,
        price: p.price,
        currency: p.currency,
        purchasedAt: p.purchasedAt,
      })),
    };
  }
}
