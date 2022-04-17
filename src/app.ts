const os = require('os');
import { Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import {
  TELEGRAM_BOT_API,
  TELEGRAM_MY_ID,
} from './config/telegramBotConfig';
import { TokenInfoService } from './service/tokenInfoService';
import { TokenPoolService } from './service/tokenPoolService';
import { TokenPriceService } from './service/tokenPriceService';
import { NotificationService } from './service/notificationService';
import { ITokenDetail } from './model/tokenModel';

export class App {
  private hostname: string = os.hostname();
  private logger: Logger = new Logger('AppFKC');
  private teleBot = new Telegraf(TELEGRAM_BOT_API);
  private tokenInfoService = new TokenInfoService();
  private tokenPoolService = new TokenPoolService();
  private tokenPriceService = new TokenPriceService();
  private notificationService = new NotificationService();

  private tokens: ITokenDetail[] = this.tokenInfoService.initTokens();
  private timer;

  async start(isRestart?: boolean) {
    if (isRestart) {
      clearInterval(this.timer);
    }

    this.logger.log('Init token...');
    try {
      this.tokens = await this.tokenInfoService.getTokenInfos(this.tokens);
      this.tokens = await this.tokenPoolService.getPools(this.tokens);

      this.teleBot.telegram.sendMessage(
        TELEGRAM_MY_ID,
        `TELE BOT ${isRestart ? 'restart' : 'start'} on ${this.hostname}`,
        {
          parse_mode: 'HTML',
        }
      );
    } catch {
      this.teleBot.telegram.sendMessage(
        TELEGRAM_MY_ID,
        `${isRestart ? 'ERROR restart' : 'ERROR start'} on ${this.hostname}`,
        {
          parse_mode: 'HTML',
        }
      );
    }
    this.logger.log('Inited!\n');

    this.recursionUpdateTokenPrice();
  }

  private async recursionUpdateTokenPrice() {
    await this.updateTokenPrice();
    await this.recursionUpdateTokenPrice();
  }

  private async updateTokenPrice() {
    this.logger.log('Update token...');
    this.tokens = await this.tokenPriceService.updateTokenPrice(this.tokens);
    this.logger.log('Updated!\n');

    this.notificationService.notifyTelegramBot(this.tokens);
  }
}
