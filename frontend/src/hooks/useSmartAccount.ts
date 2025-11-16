/**
 * Smart Account Hook
 * Creates Simple Smart Account Client using permissionless.js
 */

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useAccount, useWalletClient } from 'wagmi'
import { Address } from 'viem'
import { toSimpleSmartAccount } from 'permissionless/accounts'
import { createSmartAccountClient, type SmartAccountClient } from 'permissionless'
import { TARGET_CHAIN, ENTRY_POINT_ADDRESS, ENTRY_POINT_VERSION } from '../config/chains'
import { createCustomBundlerTransport } from '../services/bundlerTransport'
import { getPaymasterData, getPaymasterStubData } from '../services/paymasterActions'

interface UseSmartAccountReturn {
  smartAccountClient: SmartAccountClient | null
  isLoading: boolean
  error: Error | null
  eoaAddress: Address | undefined
}

const useSmartAccount = (): UseSmartAccountReturn => {
  const publicClient = usePublicClient()
  const { data: walletClient, isSuccess: isWalletClientReady } = useWalletClient({ chainId: TARGET_CHAIN.id })
  const { address: eoaAddress, isConnected, chainId } = useAccount()

  // スマートアカウント作成の前提条件
  const shouldFetch = Boolean(
    walletClient &&
    publicClient &&
    isConnected &&
    eoaAddress &&
    isWalletClientReady &&
    chainId === TARGET_CHAIN.id
  )

  const { data: smartAccountClient, isLoading, error } = useQuery({
    queryKey: ['smartAccountClient', eoaAddress],
    queryFn: async () => {
      // 型チェックであり、 shouldFetch の条件により到達しない
      if (!walletClient || !publicClient) {
        throw new Error('Missing wallet or public client')
      }

      // Create Smart Account
      const account = await toSimpleSmartAccount({
        client: publicClient,
        owner: walletClient,
        entryPoint: {
          address: ENTRY_POINT_ADDRESS,
          version: ENTRY_POINT_VERSION,
        },
      })

      // Create Smart Account Client with custom bundler and paymaster
      const client = createSmartAccountClient({
        account,
        chain: TARGET_CHAIN,
        bundlerTransport: createCustomBundlerTransport(),
        client: publicClient,
        paymaster: {
          getPaymasterData,
          getPaymasterStubData,
        },
      })

      return client
    },
    enabled: shouldFetch,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  return {
    smartAccountClient: smartAccountClient ?? null,
    isLoading,
    error: error as Error | null,
    eoaAddress,
  }
}

export default useSmartAccount
