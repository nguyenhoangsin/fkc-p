import { Telegraf } from 'telegraf';
import * as _ from 'lodash';
import { LOSER_PERCENT_NOTIFY_FLASH } from '../config/appConfig';
import {
  TELEGRAM_BOT_API,
  TELEGRAM_MY_ID,
} from '../config/telegramBotConfig';
import { TokenHelper } from '../helper/tokenHelper';
import { ITokenDetail } from '../model/tokenModel';
import { INotification } from '../model/notificationModel';

export class NotificationService {
  private teleBot = new Telegraf(TELEGRAM_BOT_API);

  notifyTelegramBot(tokens: ITokenDetail[]) {
    const notifications: INotification[] = this.getNotification(tokens);

    notifications.forEach((notification: INotification) => {
      let markdownV2: string = `<a href='https://poocoin.app/tokens/${notification.address}'>${notification.title}</a>\nPrice: ${notification.price}\nLP: ${notification.lp}\n<a href='https://tokensniffer.com/token/${notification.address}'>Tokensniffer</a>`;

      if (!!notification.web) {
        markdownV2 =
          markdownV2 + ` | <a href='${notification.web}'>Coinmarketcap</a>`;
      }

      try {
        this.teleBot.telegram.sendMessage(TELEGRAM_MY_ID, markdownV2, {
          parse_mode: 'HTML',
        });
      } catch (error) {
        this.teleBot.telegram.sendMessage(TELEGRAM_MY_ID, markdownV2, {
          parse_mode: 'HTML',
        });
      }
    });
  }

  private getNotification(tokens: ITokenDetail[]): INotification[] {
    let notifications: INotification[] = [];

    tokens.forEach((token: ITokenDetail) => {
      if (token.variationNotification?.isPush) {
        const notification: INotification = {
          address: token.address,
          title: `${
            _.isNil(token.burn)
              ? token.symbol || token.name
              : '*[' +
                TokenHelper.buildBurnPercent(token.burn) +
                '] ' +
                (token.symbol || token.name)
          } ${_.round(token.variationPrice as number, 2)}%`,
          price: TokenHelper.roundCurrency(token.price as number),
          lp: `${TokenHelper.convertToInternationalCurrencySystem(
            token.targetPool?.liquidity as number
          )} (${token.targetPool?.dApp} | ${token.targetPool?.quoteSymbol})`,
          isFlashDown: token.variationPrice <= -LOSER_PERCENT_NOTIFY_FLASH,
          web: token.web,
        };

        notifications.push(notification);
      }
    });

    return notifications;
  }
}
