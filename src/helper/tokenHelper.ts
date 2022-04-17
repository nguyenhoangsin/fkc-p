import * as _ from 'lodash';
import { utils, BigNumber } from 'ethers';

export class TokenHelper {
  static computedLiquidity(reserve: [BigNumber, BigNumber]): number {
    const reserveQuote = Number(utils.formatEther(reserve[0]));

    if (!reserveQuote) return 0;

    return reserveQuote;
  }

  static computedTokenReservePricePerQuote(
    reserve: [BigNumber, BigNumber],
    tokendecimals: number = 18
  ): number {
    const reserveQuote = Number(utils.formatEther(reserve[0]));
    const reserveToken = Number(utils.formatUnits(reserve[1], tokendecimals));

    if (!reserveQuote || !reserveToken) return 0;

    const reservePrice: number = reserveQuote / reserveToken;

    return reservePrice;
  }

  static convertToInternationalCurrencySystem(currency: number): string {
    const abs: number = Math.abs(Number(currency));
    const currencySystem: string =
      // Nine Zeroes for Billions
      abs >= 1.0e9
        ? (abs / 1.0e9).toFixed(2) + 'B'
        : // Six Zeroes for Millions
        abs >= 1.0e6
        ? (abs / 1.0e6).toFixed(2) + 'M'
        : // Three Zeroes for Thousands
        abs >= 1.0e3
        ? (abs / 1.0e3).toFixed() + 'K'
        : abs.toFixed();

    return currencySystem;
  }

  static roundCurrency(currency: number) {
    const abs: number = Math.abs(Number(currency));
    let roundedCurrency;

    if (abs >= 1) {
      const decimal: number = Math.max(
        5 - Math.floor(abs).toString().length,
        2
      );

      roundedCurrency = _.round(abs, decimal);
    } else {
      const decimal: number = Math.floor(1 / (abs % 1)).toString().length + 4;

      roundedCurrency = _.round(abs, decimal);
    }

    return roundedCurrency.toString();
  }

  static buildBurnPercent(burn?: number): string {
    if (_.isNil(burn)) {
      return '';
    }

    if (burn === -1) {
      return '?';
    }

    return burn + '%';
  }
}
