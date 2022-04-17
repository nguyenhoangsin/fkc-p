export const ABI_BEP20_FACTORY = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

export const ABI_BEP20_PROXY = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
    ],
    name: 'getSymbols',
    outputs: [
      {
        internalType: 'string[]',
        name: 'symbols',
        type: 'string[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
    ],
    name: 'getDecimals',
    outputs: [
      {
        internalType: 'uint8[]',
        name: 'decimals',
        type: 'uint8[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'factory',
        type: 'address',
      },
      {
        internalType: 'address[2][]',
        name: 'pairs',
        type: 'address[2][]',
      },
    ],
    name: 'getPoolAddress',
    outputs: [
      {
        internalType: 'address[]',
        name: 'poolAddress',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'factory',
        type: 'address',
      },
      {
        internalType: 'address[2][]',
        name: 'pairs',
        type: 'address[2][]',
      },
    ],
    name: 'getReversesMulti',
    outputs: [
      {
        internalType: 'uint112[2][]',
        name: 'reserves',
        type: 'uint112[2][]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];
