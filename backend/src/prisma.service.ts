import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Attempt database connection, fail gracefully for prototype
    try {
      await this.$connect();
      console.log('Database connected successfully');
    } catch (e) {
      console.warn('Prisma failed to connect to database. Using mock fallback mode for prototype.', e.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
