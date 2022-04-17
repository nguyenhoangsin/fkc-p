import * as _ from 'lodash';
import { utils, BigNumber } from 'ethers';
import { MIN_LIQUIDITY } from '../config/appConfig';
import {
  BUSD_BEP20,
  USDT_BEP20,
  USDC_BEP20,
  BNB_BEP20,
} from '../config/tokenBep20Config';
import {
  PANCAKE_FACTORY,
  APE_FACTORY,
  INVALID_ADDRESS,
} from '../config/web3Config';
import { TokenHelper } from '../helper/tokenHelper';
import { Web3Service } from './web3Service';
import { DApp, IPool, ITokenBase, ITokenDetail } from '../model/tokenModel';

type TPoolAddressReserve = [
  string[],
  string[],
  [BigNumber, BigNumber][],
  [BigNumber, BigNumber][]
];

type AddressReserve = {
  address: string[];
  reserve: [BigNumber, BigNumber][];
};

type TCategorizeAddressReserve = {
  busd: AddressReserve;
  usdt: AddressReserve;
  usdc: AddressReserve;
  bnb: AddressReserve;
};

type TCategorizePool = {
  pancake: TCategorizeAddressReserve;
  ape: TCategorizeAddressReserve;
};

export class TokenPoolService {
  async getPools(originTokens: ITokenBase[]) {
    let busdAdressPairs: [string, string][] = [];
    let usdtAdressPairs: [string, string][] = [];
    let usdcAdressPairs: [string, string][] = [];
    let bnbAdressPairs: [string, string][] = [];
    let adressPairs: [string, string][] = [];

    originTokens.forEach((token: ITokenDetail) => {
      busdAdressPairs.push([BUSD_BEP20.address, token.address]);
      usdtAdressPairs.push([USDT_BEP20.address, token.address]);
      usdcAdressPairs.push([USDC_BEP20.address, token.address]);
      bnbAdressPairs.push([BNB_BEP20.address, token.address]);
    });

    adressPairs = [
      ...busdAdressPairs,
      ...usdtAdressPairs,
      ...usdcAdressPairs,
      ...bnbAdressPairs,
    ];

    const poolAddressReserve: TPoolAddressReserve = await Promise.all([
      Web3Service.bep20Proxy.getPoolAddress(PANCAKE_FACTORY, adressPairs),
      Web3Service.bep20Proxy.getPoolAddress(APE_FACTORY, adressPairs),
      Web3Service.bep20Proxy.getReversesMulti(PANCAKE_FACTORY, [
        ...adressPairs,
        [BUSD_BEP20.address, BNB_BEP20.address],
      ]),
      Web3Service.bep20Proxy.getReversesMulti(APE_FACTORY, adressPairs),
    ]);

    const bnbReservePrice = TokenHelper.computedTokenReservePricePerQuote(
      _.last(poolAddressReserve[2]) as [BigNumber, BigNumber]
    );

    const categorizePool: TCategorizePool = this.mappingCategorizePool(
      poolAddressReserve,
      originTokens.length
    );

    const tokens: ITokenDetail[] = originTokens
      .map((token: ITokenDetail, index: number): ITokenDetail => {
        const pancakePoolAddress: IPool[] = this.mappingPoolAddressReserve(
          DApp.PANCAKE,
          categorizePool.pancake,
          index,
          token.decimals as number,
          bnbReservePrice
        );
        const apePoolAddress: IPool[] = this.mappingPoolAddressReserve(
          DApp.APE,
          categorizePool.ape,
          index,
          token.decimals as number,
          bnbReservePrice
        );
        const targetPool: IPool = _.maxBy(
          [...pancakePoolAddress, ...apePoolAddress],
          'liquidity'
        ) as IPool;

        return {
          ...token,
          price: targetPool.reservePrice,
          targetPool,
          pools: [...pancakePoolAddress, ...apePoolAddress],
        };
      })
      .filter(
        (token: ITokenDetail): boolean =>
          (token.targetPool?.liquidity || 0) >= MIN_LIQUIDITY
      );

    return tokens;
  }

  private mappingCategorizePool(
    poolAddressReserve: TPoolAddressReserve,
    chunkNumber: number
  ): TCategorizePool {
    const chunkAddressPancake = _.chunk(poolAddressReserve[0], chunkNumber);
    const chunkAddressApe = _.chunk(poolAddressReserve[1], chunkNumber);
    const chunkReservePancake = _.chunk(poolAddressReserve[2], chunkNumber);
    const chunkReserveApe = _.chunk(poolAddressReserve[3], chunkNumber);

    const categorizePool: TCategorizePool = {
      pancake: {
        busd: {
          address: chunkAddressPancake[0],
          reserve: chunkReservePancake[0],
        },
        usdt: {
          address: chunkAddressPancake[1],
          reserve: chunkReservePancake[1],
        },
        usdc: {
          address: chunkAddressPancake[2],
          reserve: chunkReservePancake[2],
        },
        bnb: {
          address: chunkAddressPancake[3],
          reserve: chunkReservePancake[3],
        },
      },
      ape: {
        busd: {
          address: chunkAddressApe[0],
          reserve: chunkReserveApe[0],
        },
        usdt: {
          address: chunkAddressApe[1],
          reserve: chunkReserveApe[1],
        },
        usdc: {
          address: chunkAddressApe[2],
          reserve: chunkReserveApe[2],
        },
        bnb: {
          address: chunkAddressApe[3],
          reserve: chunkReserveApe[3],
        },
      },
    };

    return categorizePool;
  }

  private mappingPoolAddressReserve(
    dApp: DApp,
    categorizeAddressReserve: TCategorizeAddressReserve,
    tokenIndex: number,
    tokenDecimals: number,
    bnbReservePrice: number
  ): IPool[] {
    let pools: IPool[] = [
      {
        dApp,
        address:
          categorizeAddressReserve.busd.address[tokenIndex].toLowerCase(),
        quoteSymbol: BUSD_BEP20.symbol as string,
        quoteAddress: BUSD_BEP20.address,
        liquidity: TokenHelper.computedLiquidity(
          categorizeAddressReserve.busd.reserve[tokenIndex]
        ),
        reservePrice: TokenHelper.computedTokenReservePricePerQuote(
          categorizeAddressReserve.busd.reserve[tokenIndex],
          tokenDecimals
        ),
        reserve: [
          utils.formatUnits(
            categorizeAddressReserve.busd.reserve[tokenIndex][0],
            tokenDecimals
          ),
          utils.formatUnits(
            categorizeAddressReserve.busd.reserve[tokenIndex][1],
            tokenDecimals
          ),
        ],
      },
      {
        dApp,
        address:
          categorizeAddressReserve.usdt.address[tokenIndex].toLowerCase(),
        quoteSymbol: USDT_BEP20.symbol as string,
        quoteAddress: USDT_BEP20.address,
        liquidity: TokenHelper.computedLiquidity(
          categorizeAddressReserve.usdt.reserve[tokenIndex]
        ),
        reservePrice: TokenHelper.computedTokenReservePricePerQuote(
          categorizeAddressReserve.usdt.reserve[tokenIndex],
          tokenDecimals
        ),
        reserve: [
          utils.formatUnits(
            categorizeAddressReserve.usdt.reserve[tokenIndex][0],
            tokenDecimals
          ),
          utils.formatUnits(
            categorizeAddressReserve.usdt.reserve[tokenIndex][1],
            tokenDecimals
          ),
        ],
      },
      {
        dApp,
        address:
          categorizeAddressReserve.usdc.address[tokenIndex].toLowerCase(),
        quoteSymbol: USDC_BEP20.symbol as string,
        quoteAddress: USDC_BEP20.address,
        liquidity: TokenHelper.computedLiquidity(
          categorizeAddressReserve.usdc.reserve[tokenIndex]
        ),
        reservePrice: TokenHelper.computedTokenReservePricePerQuote(
          categorizeAddressReserve.usdc.reserve[tokenIndex],
          tokenDecimals
        ),
        reserve: [
          utils.formatUnits(
            categorizeAddressReserve.usdc.reserve[tokenIndex][0],
            tokenDecimals
          ),
          utils.formatUnits(
            categorizeAddressReserve.usdc.reserve[tokenIndex][1],
            tokenDecimals
          ),
        ],
      },
      {
        dApp,
        address: categorizeAddressReserve.bnb.address[tokenIndex].toLowerCase(),
        quoteSymbol: BNB_BEP20.symbol as string,
        quoteAddress: BNB_BEP20.address,
        liquidity:
          TokenHelper.computedLiquidity(
            categorizeAddressReserve.bnb.reserve[tokenIndex]
          ) * bnbReservePrice,
        reservePrice:
          TokenHelper.computedTokenReservePricePerQuote(
            categorizeAddressReserve.bnb.reserve[tokenIndex],
            tokenDecimals
          ) * bnbReservePrice,
        reserve: [
          utils.formatUnits(
            categorizeAddressReserve.bnb.reserve[tokenIndex][0],
            tokenDecimals
          ),
          utils.formatUnits(
            categorizeAddressReserve.bnb.reserve[tokenIndex][1],
            tokenDecimals
          ),
        ],
      },
    ];

    pools = pools.filter(
      (pool: IPool): boolean => pool.address !== INVALID_ADDRESS
    );

    return pools;
  }
}
