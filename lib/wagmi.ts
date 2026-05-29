import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

const arcTestnet = {
  id: 1315,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
  },
} as const;

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'Settle' }),
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});