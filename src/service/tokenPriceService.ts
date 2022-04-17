import { Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { BigNumber } from 'ethers';
import {
  TIME_CACHE_TOKEN_PRICE,
  TIME_RESET_NOTIFICATION,
  LOSER_PERCENT_NOTIFY,
  LOSER_PERCENT_NOTIFY_UP,
} from '../config/appConfig';
import {
  BUSD_BEP20,
  USDT_BEP20,
  USDC_BEP20,
  BNB_BEP20,
} from '../config/tokenBep20Config';
import { PANCAKE_FACTORY, APE_FACTORY } from '../config/web3Config';
import { TokenHelper } from '../helper/tokenHelper';
import { Web3Service } from './web3Service';
import {
  DApp,
  IPool,
  ITokenDetail,
  CachePrice,
  TimelinePrice,
  IVariationNotification,
} from '../model/tokenModel';

type TTokenReserve = { [key: string]: [BigNumber, BigNumber] };

export class TokenPriceService {
  private logger: Logger = new Logger('TokenPriceService');

  async updateTokenPrice(originTokens: ITokenDetail[]) {
    let pancakeAdressPairs: [string, string][] = [];
    let apeAdressPairs: [string, string][] = [];

    originTokens.forEach((token: ITokenDetail) => {
      switch (token.targetPool?.dApp) {
        case DApp.PANCAKE:
          pancakeAdressPairs.push([
            token.targetPool?.quoteAddress as string,
            token.address,
          ]);
          break;

        case DApp.APE:
          apeAdressPairs.push([
            token.targetPool?.quoteAddress as string,
            token.address,
          ]);
          break;
      }
    });

    let poolReserve: [[BigNumber, BigNumber][], [BigNumber, BigNumber][]];
    let isRequestError = false;

    try {
      poolReserve = await Promise.all([
        Web3Service.bep20Proxy.getReversesMulti(PANCAKE_FACTORY, [
          ...pancakeAdressPairs,
          [BUSD_BEP20.address, BNB_BEP20.address],
        ]),
        Web3Service.bep20Proxy.getReversesMulti(APE_FACTORY, apeAdressPairs),
      ]);
    } catch (error) {
      isRequestError = true;
      this.logger.log(error);
    }

    if (isRequestError) {
      return originTokens;
    }

    const bnbReservePrice = TokenHelper.computedTokenReservePricePerQuote(
      _.last(poolReserve[0]) as [BigNumber, BigNumber]
    );

    const tokenReserve: TTokenReserve = this.mappingTokeReserve(
      [...pancakeAdressPairs, ...apeAdressPairs],
      [...poolReserve[0].slice(0, poolReserve[0].length - 1), ...poolReserve[1]]
    );

    const tokens: ITokenDetail[] = originTokens.map(
      (token: ITokenDetail): ITokenDetail => {
        const reserve = tokenReserve[token.address];
        let liquidity: number = token.targetPool?.liquidity as number;
        let reservePrice: number = token.price as number;

        switch (token.targetPool?.quoteAddress) {
          case BUSD_BEP20.address:
          case USDT_BEP20.address:
          case USDC_BEP20.address:
            liquidity = TokenHelper.computedLiquidity(reserve);
            reservePrice = TokenHelper.computedTokenReservePricePerQuote(
              reserve,
              token.decimals
            );

            break;

          case BNB_BEP20.address:
            liquidity =
              TokenHelper.computedLiquidity(reserve) * bnbReservePrice;
            reservePrice =
              TokenHelper.computedTokenReservePricePerQuote(
                reserve,
                token.decimals
              ) * bnbReservePrice;

            break;
        }

        const cachePrice: CachePrice = this.computedCachePrice(
          token.cachePrice as CachePrice,
          token.price as number
        );
        const variationPrice: number = this.computedVariationPrice(
          token.price as number,
          cachePrice.price
        );
        const variationNotification: IVariationNotification =
          this.computedVariationNotification(
            variationPrice,
            token.variationNotification as IVariationNotification
          );

        return {
          ...token,
          price: reservePrice,
          targetPool: {
            ...(token.targetPool as IPool),
            liquidity,
            reservePrice,
          },
          cachePrice,
          variationPrice,
          variationNotification,
        };
      }
    );

    return tokens;
  }

  private mappingTokeReserve(
    addressPairs: [string, string][],
    reserve: [BigNumber, BigNumber][]
  ): TTokenReserve {
    const tokenReserve: TTokenReserve = {};

    addressPairs.forEach((address: [string, string], index: number) => {
      tokenReserve[address[1]] = reserve[index];
    });

    return tokenReserve;
  }

  private computedCachePrice(
    cachePrice: CachePrice,
    price: number
  ): CachePrice {
    let newCachePrice: CachePrice;
    const newTimelinePrice = {
      price,
      timestamp: +new Date(),
    };

    if (cachePrice) {
      let timelinePrices: TimelinePrice[] = [
        ...cachePrice.timelinePrices,
        newTimelinePrice,
      ];

      if (
        newTimelinePrice.timestamp - timelinePrices[0].timestamp >
        TIME_CACHE_TOKEN_PRICE
      ) {
        timelinePrices = timelinePrices.slice(1, timelinePrices.length);
      }

      newCachePrice = { price: timelinePrices[0].price, timelinePrices };
    } else {
      newCachePrice = { price, timelinePrices: [newTimelinePrice] };
    }

    return newCachePrice;
  }

  private computedVariationPrice(price: number, cachePrice: number): number {
    if (!price || !cachePrice) {
      return 0;
    }

    const variationPrice: number = ((price - cachePrice) / cachePrice) * 100;

    return variationPrice;
  }

  private computedVariationNotification(
    variation: number,
    prevNotification: IVariationNotification
  ): IVariationNotification {
    let notification: IVariationNotification = {
      isPush: false,
      hasOncePush: false,
      timestamp: +new Date(2100, 1, 1),
    };

    if (
      !prevNotification ||
      +new Date() - prevNotification.timestamp >= TIME_RESET_NOTIFICATION
    ) {
      if (variation <= -LOSER_PERCENT_NOTIFY) {
        notification = {
          cacheVariation: variation,
          isPush: true,
          hasOncePush: true,
          timestamp: +new Date(),
        };
      }
    } else {
      if (prevNotification.hasOncePush) {
        if (
          variation <=
          prevNotification.cacheVariation - LOSER_PERCENT_NOTIFY_UP
        ) {
          notification = {
            ...prevNotification,
            cacheVariation: variation,
            isPush: true,
          };
        } else {
          notification = {
            ...prevNotification,
            isPush: false,
          };
        }
      } else {
        if (variation <= -LOSER_PERCENT_NOTIFY) {
          notification = {
            cacheVariation: variation,
            isPush: true,
            hasOncePush: true,
            timestamp: +new Date(),
          };
        }
      }
    }

    return notification;
  }
}
