'use client'

import { userHasWallet } from '@civic/auth-web3'
import { useUser } from '@civic/auth-web3/react'
import { UserButton } from '@civic/auth-web3/react'
import { useConnect, useAccount, useBalance } from 'wagmi'
import { useState } from 'react'

export function CivicWallet() {
  const userContext = useUser()
  const { connectors, connect } = useConnect()
  const { isConnected, address } = useAccount()
  const balance = useBalance({ address })
  const [isCreating, setIsCreating] = useState(false)

  // Find the Civic embedded wallet connector
  const civicConnector = connectors.find((c) => c.id === 'civic')

  const handleCreateWallet = async () => {
    if (userContext.user && !userHasWallet(userContext)) {
      setIsCreating(true)
      try {
        await userContext.createWallet()
      } catch (error) {
        console.error('Error creating wallet:', error)
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handleConnectWallet = () => {
    if (civicConnector) {
      connect({ connector: civicConnector })
    }
  }

  return (
    <div className="civic-wallet-container">
      {/* Civic Auth User Button for login/logout */}
      <UserButton />

      {userContext.user && (
        <div className="wallet-section">
          {!userHasWallet(userContext) ? (
            // User doesn't have a wallet yet - show create button
            <div className="create-wallet">
              <p>Create your embedded wallet to get started</p>
              <button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="btn-create-wallet"
              >
                {isCreating ? 'Creating Wallet...' : 'Create Wallet'}
              </button>
            </div>
          ) : (
            // User has a wallet
            <div className="wallet-info">
              <div className="wallet-address">
                <strong>Wallet Address:</strong>{' '}
                {userContext.ethereum.address.slice(0, 6)}...
                {userContext.ethereum.address.slice(-4)}
              </div>

              {isConnected ? (
                // Wallet is connected - show balance
                <div className="wallet-connected">
                  <p className="status-connected">✓ Wallet Connected</p>
                  <div className="balance">
                    <strong>Balance:</strong>{' '}
                    {balance?.data
                      ? `${(
                          BigInt(balance.data.value) / BigInt(1e18)
                        ).toString()} ${balance.data.symbol}`
                      : 'Loading...'}
                  </div>
                </div>
              ) : (
                // Wallet exists but not connected - show connect button
                <button
                  onClick={handleConnectWallet}
                  className="btn-connect-wallet"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .civic-wallet-container {
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        .wallet-section {
          margin-top: 20px;
        }

        .create-wallet,
        .wallet-info {
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .create-wallet p {
          margin-bottom: 12px;
          color: #6b7280;
        }

        .btn-create-wallet,
        .btn-connect-wallet {
          background: #3b82f6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-create-wallet:hover,
        .btn-connect-wallet:hover {
          background: #2563eb;
        }

        .btn-create-wallet:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .wallet-address {
          margin-bottom: 12px;
          font-family: monospace;
        }

        .wallet-connected {
          margin-top: 12px;
        }

        .status-connected {
          color: #10b981;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .balance {
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  )
}
