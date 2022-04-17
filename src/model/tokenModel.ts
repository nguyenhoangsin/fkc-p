export enum DApp {
  PANCAKE = 'PANCAKE',
  APE = 'APE',
}

export interface ITokenBase {
  name: string;
  symbol?: string;
  address: string;
  decimals?: number;
  logoURI?: string;
  burn?: number;
  web?: string;
}

export interface TimelinePrice {
  price: number;
  timestamp: number;
}

export interface CachePrice {
  price: number;
  timelinePrices: TimelinePrice[];
}

export interface IPool {
  dApp?: DApp;
  address: string;
  quoteSymbol: string;
  quoteAddress: string;
  liquidity?: number;
  reservePrice?: number;
  reserve?: [string, string];
}

export interface IVariationNotification {
  cacheVariation?: number;
  isPush: boolean;
  hasOncePush: boolean;
  timestamp: number;
}

export interface ITokenDetail extends ITokenBase, ITokenPrice {
  targetPool?: IPool;
  pools?: IPool[];
  variationNotification?: IVariationNotification;
}

interface ITokenPrice {
  price?: number;
  oldPrice?: number;
  sellPrice?: number;
  buyPrice?: number;
  variationPrice?: number;
  cachePrice?: CachePrice;
}
