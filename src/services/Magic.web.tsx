import {Magic} from 'magic-sdk';
import {OAuthExtension} from '@magic-ext/oauth';
import Web3 from 'web3';

import {BlockchainNetwork, NetworkConfig} from 'services/config';

export function isMatic(config: NetworkConfig) {
  return config.magicNetwork !== BlockchainNetwork.Rinkeby;
}

export function magicGenerator(config: NetworkConfig) {
  return new Magic(config.magicApiKey, {
    extensions: [new OAuthExtension()],
    network: isMatic(config)
      ? {
          rpcUrl: config.web3Url,
          chainId: Number(config.chainId),
        }
      : 'rinkeby',
  });
}

export {Magic};

export default Web3;
