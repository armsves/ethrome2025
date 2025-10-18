import { http } from '@wagmi/core'
import { createConfig } from 'wagmi'
import { embeddedWallet } from '@civic/auth-web3/wagmi'
import { arbitrumSepolia } from 'viem/chains'

// Create a separate Wagmi config for Civic that includes the embeddedWallet connector
export const civicWagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http()
  },
  connectors: [
    embeddedWallet(),
  ],
})
