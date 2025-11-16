/**
 * Custom Bundler Transport
 * Maps EIP-1193 RPC calls to custom backend API
 */

import { custom } from 'viem'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 1946

/**
 * Convert BigInt values to strings for JSON serialization
 */
function serializeBigInt(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key])
    }
    return result
  }
  return obj
}

/**
 * Convert string values back to BigInt where appropriate
 */
function deserializeBigInt(obj: any): any {
  if (typeof obj === 'string' && /^\d+$/.test(obj)) {
    // Only convert numeric strings that look like they should be BigInt
    // Be conservative to avoid breaking regular strings
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeBigInt)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      // Convert specific fields that should be BigInt
      if (
        [
          'actualGasUsed',
          'actualGasCost',
          'nonce',
          'blockNumber',
          'callGasLimit',
          'verificationGasLimit',
          'preVerificationGas',
          'maxFeePerGas',
          'maxPriorityFeePerGas',
          'paymasterVerificationGasLimit',
          'paymasterPostOpGasLimit',
        ].includes(key)
      ) {
        result[key] = typeof obj[key] === 'string' ? BigInt(obj[key]) : obj[key]
      } else {
        result[key] = deserializeBigInt(obj[key])
      }
    }
    return result
  }
  return obj
}

/**
 * Create EIP-1193 compatible provider for custom bundler
 */
const createBundlerProvider = () => ({
  async request({ method, params }: { method: string; params?: any[] }) {
    console.log(`🔌 Bundler RPC: ${method}`, params)

    switch (method) {
      case 'eth_sendUserOperation': {
        const [userOp, entryPoint] = params as [any, string]

        const response = await fetch(`${API_BASE_URL}/api/user-operations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userOp: serializeBigInt(userOp),
            chainId: CHAIN_ID,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Submission failed')
        }

        const data = await response.json()
        console.log(`✅ eth_sendUserOperation result:`, data.data.userOpHash)
        return data.data.userOpHash
      }

      case 'eth_getUserOperationReceipt': {
        const [hash] = params as [string]

        const response = await fetch(`${API_BASE_URL}/api/user-operations/${hash}`)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Receipt fetch failed')
        }

        const data = await response.json()

        // If still pending, return null (standard behavior)
        if (data.data.status === 'pending') {
          console.log(`⏳ eth_getUserOperationReceipt: pending`)
          return null
        }

        // Convert receipt to viem format
        const receipt = data.data.receipt
        if (receipt) {
          const viemReceipt = deserializeBigInt(receipt)
          console.log(`✅ eth_getUserOperationReceipt result:`, viemReceipt)
          return viemReceipt
        }

        return null
      }

      case 'eth_getUserOperationByHash': {
        const [hash] = params as [string]

        const response = await fetch(`${API_BASE_URL}/api/user-operations/${hash}`)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'UserOp fetch failed')
        }

        const data = await response.json()
        console.log(`✅ eth_getUserOperationByHash result:`, data.data)
        return deserializeBigInt(data.data)
      }

      default:
        throw new Error(`Unsupported bundler method: ${method}`)
    }
  },
})

/**
 * Create custom bundler transport
 */
export function createCustomBundlerTransport() {
  const provider = createBundlerProvider()
  return custom(provider)
}
