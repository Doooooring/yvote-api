import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies?.['access_token'];

      if (!token) {
        throw new Error('TokenNotExist');
      }

      const payload = await this.jwtService.verifyAsync(token);
      return true;
    } catch (e) {
      throw Error(e);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

class Pool {
  private ticks: Tick[];
  private currentTick: number;
  private positions: Record<number, Position> = {};
  private index: number = 0;
  private rewardGrowthGlobal: number = 0;
  private currentTickLiquidity: number = 0;

  constructor() {
    this.ticks = new Array<Tick>(100);
    this.currentTick = 50;
  }

  addPosition(tickLower: number, tickUpper: number, liquidity: number): number {
    const id = this.index++;
    this.positions[id] = {
      tickLower,
      tickUpper,
      liquidity,
      rewardGrowthInsideLast: this.rewardGrowthInside(tickLower, tickUpper),
    };
    if (this.currentTick >= tickLower && this.currentTick <= tickUpper) {
      this.currentTickLiquidity += liquidity;
    }

    const lowerTick = this.getTickSafe(tickLower);
    if (lowerTick.liquidityGross === 0 && tickLower <= this.currentTick) {
      this.ticks[tickLower].rewardGrowthOutside = this.rewardGrowthGlobal;
    }

    this.ticks[tickLower].liquidityGross += liquidity;
    this.ticks[tickLower].liquidityNet += liquidity;

    const upperTick = this.getTickSafe(tickUpper);
    if (upperTick.liquidityGross === 0 && tickUpper <= this.currentTick) {
      this.ticks[tickUpper].rewardGrowthOutside = this.rewardGrowthGlobal;
    }

    this.ticks[tickUpper].liquidityGross += liquidity;
    this.ticks[tickUpper].liquidityNet -= liquidity;

    return id;
  }

  addReward(amount: number) {
    this.rewardGrowthGlobal += amount / this.currentTickLiquidity;
  }

  incTick() {
    this.crossTick(this.currentTick, true);
    this.currentTick++;
  }

  decTick() {
    this.crossTick(this.currentTick, false);
    this.currentTick--;
  }

  claimReward(id: number): number {
    const rewardGrowthInside = this.rewardGrowthInside(
      this.positions[id].tickLower,
      this.positions[id].tickUpper,
    );

    const reward =
      (rewardGrowthInside - this.positions[id].rewardGrowthInsideLast) *
      this.positions[id].liquidity;

    this.positions[id].rewardGrowthInsideLast = rewardGrowthInside;
    return reward;
  }

  crossTick(tick: number, inc: boolean) {
    this.ticks[tick].rewardGrowthOutside =
      this.rewardGrowthGlobal - this.ticks[tick].rewardGrowthOutside;
    this.currentTickLiquidity +=
      (inc ? 1 : -1) * this.getTickSafe(tick).liquidityNet;
  }

  rewardGrowthInside(tickLower: number, tickUpper: number): number {
    const lower = this.getTickSafe(tickLower, false);
    const upper = this.getTickSafe(tickUpper, false);
    const rewardGrowthBelow =
      this.currentTick >= tickLower
        ? lower.rewardGrowthOutside
        : this.rewardGrowthGlobal - lower.rewardGrowthOutside;
    const rewardGrowthAbove =
      this.currentTick <= tickUpper
        ? upper.rewardGrowthOutside
        : this.rewardGrowthGlobal - upper.rewardGrowthOutside;
    return this.rewardGrowthGlobal - rewardGrowthBelow - rewardGrowthAbove;
  }

  getTickSafe(tick: number, write = true): Tick {
    if (this.ticks[tick] === undefined) {
      if (write) {
        this.ticks[tick] = {
          liquidityGross: 0,
          liquidityNet: 0,
          rewardGrowthOutside: 0,
        };
        return this.ticks[tick];
      }
      return { liquidityGross: 0, liquidityNet: 0, rewardGrowthOutside: 0 };
    } else {
      return this.ticks[tick];
    }
  }
}

interface Tick {
  liquidityGross: number;
  liquidityNet: number;
  rewardGrowthOutside: number;
}

interface Position {
  tickLower: number;
  tickUpper: number;
  liquidity: number;
  rewardGrowthInsideLast: number;
}

const pool = new Pool();
const id1 = pool.addPosition(20, 50, 100);
const id2 = pool.addPosition(40, 70, 100);
pool.addReward(30); // add reward to tick 50
pool.incTick(); // move tick to 49
pool.addReward(30); // add reward to tick 49

console.log(pool.claimReward(id1)); // must be 30 * 100 / (100 + 200) + 30 * 100 / 100
console.log(pool.claimReward(id2)); // must be 30 * 200 / (100 + 200)
