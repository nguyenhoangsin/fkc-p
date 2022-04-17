import * as _ from 'lodash';
import { TOKEN_BEP20_TRACKING } from '../config/tokenBep20TrackingConfig';
import { Web3Service } from './web3Service';
import { ITokenBase, ITokenDetail } from '../model/tokenModel';

export class TokenInfoService {
  initTokens(): ITokenBase[] {
    const tokens: ITokenBase[] = _.chain(TOKEN_BEP20_TRACKING)
      .map(
        (token: ITokenBase): ITokenBase => ({
          ...token,
          address: token.address.toLowerCase(),
        })
      )
      .uniqBy('address')
      .value();

    return tokens;
  }

  async getTokenInfos(tokenBases: ITokenBase[]): Promise<ITokenDetail[]> {
    let tokens: ITokenDetail[] = tokenBases;
    const tokenAddress: string[] = tokens.map(
      (token: ITokenDetail) => token.address
    );

    const infos: [string[], number[]] = await Promise.all([
      Web3Service.bep20Proxy.getSymbols(tokenAddress),
      Web3Service.bep20Proxy.getDecimals(tokenAddress),
    ]);

    tokens = tokens.map(
      (token: ITokenDetail, index: number): ITokenDetail => ({
        ...token,
        symbol: infos[0][index],
        decimals: infos[1][index],
      })
    );

    return tokens;
  }
}
