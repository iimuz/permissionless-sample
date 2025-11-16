/**
 * Bundler Service
 * Handles UserOperation submission to Startale Bundler via permissionless.js
 */

import { createPublicClient, http, type Hash, type PublicClient } from 'viem'
import { deepHexlify } from 'permissionless/utils'
import type {
  UserOperation,
  UserOperationReceipt,
} from '../types/userOperation.js'

const BUNDLER_URL = process.env.BUNDLER_URL
const ENTRY_POINT_ADDRESS = (process.env.ENTRY_POINT_ADDRESS ||
  '0x0000000071727De22E5E9d8BAf0edAc6f37da032') as `0x${string}`
const BUNDLER_API_KEY = process.env.BUNDLER_API_KEY // Add this line

// viem client for debugging
let bundlerClient: PublicClient | undefined

function getBundlerClient() {
  if (!bundlerClient) {
    const transport = BUNDLER_API_KEY
      ? http(BUNDLER_URL!, {
        fetchOptions: {
          headers: {
            'x-api-key': BUNDLER_API_KEY,
          },
        },
      })
      : http(BUNDLER_URL!)

    bundlerClient = createPublicClient({
      transport,
    })
  }
  return bundlerClient
}

if (!BUNDLER_URL) {
  throw new Error('BUNDLER_URL is not configured')
}

// Helper function to get headers with optional API key
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (BUNDLER_API_KEY) {
    headers['x-api-key'] = BUNDLER_API_KEY;
  }
  return headers;
};

/**
 * Submit UserOperation to Bundler
 */
export async function sendUserOperation(
  userOp: UserOperation
): Promise<`0x${string}`> {
  console.log('🚀 Submitting UserOperation to Bundler...')

  try {
    // Use deepHexlify to ensure proper RPC formatting, same as in paymasterService
    const userOpForRpc = deepHexlify(userOp)

    const response = await fetch(BUNDLER_URL, {
      method: 'POST',
      headers: getHeaders(), // Use getHeaders here
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOpForRpc, ENTRY_POINT_ADDRESS],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bundler request failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log("send user operation response: ", data);

    if (data.error) {
      throw new Error(`Bundler error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    const userOpHash = data.result as `0x${string}`
    console.log(`✅ UserOperation submitted: ${userOpHash}`)

    return userOpHash
  } catch (error) {
    console.error('❌ Bundler submission error:', error)
    throw error
  }
}

/**
 * Get UserOperation receipt
 */
export async function getUserOperationReceipt(
  userOpHash: `0x${string}`
): Promise<UserOperationReceipt | null> {
  console.log(`🔍 Fetching receipt for: ${userOpHash}`)

  // 🐞 Debug with viem client
  try {
    console.log('🐞 [Debug with viem] Sending eth_getUserOperationReceipt...');
    const client = getBundlerClient();
    const receiptFromViem = await client.request({
      method: 'eth_getUserOperationReceipt' as any,
      params: [userOpHash as Hash],
    });
    console.log('🐞 [Debug with viem] eth_getUserOperationReceipt result:', receiptFromViem);
  } catch (debugError) {
    console.error('🐞 [Debug with viem] Error:', debugError);
  }

  try {
    // For debugging: eth_getUserOperationByHash
    try {
      const byHashResponse = await fetch(BUNDLER_URL, {
        method: 'POST',
        headers: getHeaders(), // Use getHeaders here
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationByHash',
          params: [userOpHash],
        }),
      })
      if (byHashResponse.ok) {
        const byHashData = await byHashResponse.json()
        console.log('📦 [Debug] eth_getUserOperationByHash result:', byHashData)
      } else {
        console.log('📦 [Debug] eth_getUserOperationByHash request failed:', byHashResponse.status)
      }
    } catch (debugError) {
      console.error('📦 [Debug] eth_getUserOperationByHash call failed:', debugError)
    }

    const response = await fetch(BUNDLER_URL, {
      method: 'POST',
      headers: getHeaders(), // Use getHeaders here
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
      }),
    })
    console.log("response", response, "BUNDLER_URL", BUNDLER_URL);

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bundler receipt request failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log("🧾 eth_getUserOperationReceipt result:", data);

    if (data.error) {
      throw new Error(`Bundler error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    if (!data.result) {
      console.log('⏳ Receipt not yet available')
      return null
    }

    const receipt = data.result

    console.log('✅ Receipt found')

    return {
      userOpHash: receipt.userOpHash,
      sender: receipt.sender,
      nonce: BigInt(receipt.nonce),
      actualGasUsed: BigInt(receipt.actualGasUsed),
      actualGasCost: BigInt(receipt.actualGasCost),
      success: receipt.success,
      receipt: {
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: BigInt(receipt.receipt.blockNumber),
        blockHash: receipt.receipt.blockHash,
        logs: receipt.receipt.logs,
      },
    }
  } catch (error) {
    console.error('❌ Receipt retrieval error:', error)
    throw error
  }
}
