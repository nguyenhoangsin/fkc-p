import { providers, Contract } from 'ethers';
import { ABI_BEP20_FACTORY, ABI_BEP20_PROXY } from '../config/abiBep20Config';
import {
  BSC_NODE,
  PANCAKE_FACTORY,
  APE_FACTORY,
  BEP20_PROXY,
} from '../config/web3Config';

export class Web3Service {
  static bscProvider = new providers.JsonRpcProvider(BSC_NODE);

  static pancakeFactory: Contract = new Contract(
    PANCAKE_FACTORY,
    ABI_BEP20_FACTORY,
    Web3Service.bscProvider
  );

  static apeFactory: Contract = new Contract(
    APE_FACTORY,
    ABI_BEP20_FACTORY,
    Web3Service.bscProvider
  );

  static bep20Proxy: Contract = new Contract(
    BEP20_PROXY,
    ABI_BEP20_PROXY,
    Web3Service.bscProvider
  );
}
