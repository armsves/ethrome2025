'use client'

import { wagmiAdapter } from '@/config/wagmiConfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { WagmiProvider, type Config } from 'wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
//import { base } from '@/config/wagmiNetworks'

// Set up queryClient
const queryClient = new QueryClient()

function ContextProvider({ children }: { children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'default',
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
          miniKit={{ enabled: true }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider