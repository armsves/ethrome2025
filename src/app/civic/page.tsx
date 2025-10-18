'use client'

import { CivicWallet } from '@/components/CivicWallet'

export default function CivicPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Civic Embedded Wallet Demo
        </h1>
        <p className="text-gray-600">
          Try out Civic&apos;s embedded wallet on Arbitrum Sepolia testnet
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          How to use:
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>Click the &quot;Sign In&quot; button to log in with Civic</li>
          <li>After logging in, click &quot;Create Wallet&quot; to create your embedded wallet</li>
          <li>Click &quot;Connect Wallet&quot; to activate your wallet</li>
          <li>View your wallet address and balance on Arbitrum Sepolia</li>
        </ol>
      </div>

      <CivicWallet />

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">About this demo:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Network: Arbitrum Sepolia (testnet)</li>
          <li>• Wallet type: Non-custodial embedded wallet</li>
          <li>• Connection: Manual (click to connect)</li>
          <li>• No private keys stored by app or Civic</li>
        </ul>
      </div>
    </div>
  )
}
