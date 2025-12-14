import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BlacklistService {
  private client: Redis;
  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url);
  }
  async blacklist(jti: string, expSec: number) {
    const ttl = Math.max(expSec - Math.floor(Date.now()/1000), 60);
    await this.client.set(`jwt:blacklist:${jti}`, '1', 'EX', ttl);
  }
  async isBlacklisted(jti: string) {
    const v = await this.client.get(`jwt:blacklist:${jti}`);
    return v === '1';
  }
}
