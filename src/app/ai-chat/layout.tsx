'use client'

import { CivicAuthProvider } from '@civic/auth-web3/react'
import { WagmiProvider } from 'wagmi'
import { civicWagmiConfig } from '@/config/civicWagmiConfig'
import { arbitrumSepolia } from 'viem/chains'
import { ReactNode } from 'react'

export default function AIChatLayout({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={civicWagmiConfig}>
      <CivicAuthProvider
        clientId="0b237c82-2283-43b1-84b1-1edb63f82038"
        initialChain={arbitrumSepolia}
      >
        {children}
      </CivicAuthProvider>
    </WagmiProvider>
  )
}
