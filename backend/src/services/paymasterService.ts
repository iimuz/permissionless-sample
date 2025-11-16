/**
 * Paymaster Service
 * Handles gas sponsorship using Startale Paymaster via permissionless.js
 */

import { createPublicClient, http, type Chain, toHex, concat } from 'viem'
import { deepHexlify } from 'permissionless/utils'
import type { UserOperation } from '../types/userOperation.js'

const PAYMASTER_URL = process.env.PAYMASTER_URL
const PAYMASTER_ID = process.env.PAYMASTER_ID
const ENTRY_POINT_ADDRESS = (process.env.ENTRY_POINT_ADDRESS || '0x0000000071727De22E5E9d8BAf0edAc6f37da032') as `0x${string}`

if (!PAYMASTER_URL) {
  throw new Error('PAYMASTER_URL is not configured')
}
if (!PAYMASTER_ID) {
  throw new Error('PAYMASTER_ID is not configured')
}

/**
 * Get paymaster data for UserOperation sponsorship
 */
export async function getPaymasterData(
  userOp: Partial<UserOperation>,
  chain: Chain
): Promise<{
  paymaster?: `0x${string}`
  paymasterData?: `0x${string}`
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  callGasLimit?: bigint
  verificationGasLimit?: bigint
  preVerificationGas?: bigint
}> {
  console.log('🔍 Requesting Paymaster sponsorship...')
  console.log('Paymaster URL:', PAYMASTER_URL)

  const paymasterContext = {
    paymasterId: PAYMASTER_ID,
    calculateGasLimits: true,
  }

  const requestBody = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'pm_getPaymasterData',
    params: [
      deepHexlify(userOp),
      ENTRY_POINT_ADDRESS,
      toHex(chain.id),
      paymasterContext
    ],
  })
  console.log('Paymaster Request Body:', requestBody)

  try {
    // Startale Paymaster RPC call
    const response = await fetch(PAYMASTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Paymaster request failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Paymaster error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    console.log('✅ Paymaster sponsorship received')

    const result = data.result

    return {
      paymaster: result.paymaster,
      paymasterData: result.paymasterData,
      paymasterVerificationGasLimit: result.paymasterVerificationGasLimit ? BigInt(result.paymasterVerificationGasLimit) : undefined,
      paymasterPostOpGasLimit: result.paymasterPostOpGasLimit ? BigInt(result.paymasterPostOpGasLimit) : undefined,
      callGasLimit: result.callGasLimit ? BigInt(result.callGasLimit) : undefined,
      verificationGasLimit: result.verificationGasLimit ? BigInt(result.verificationGasLimit) : undefined,
      preVerificationGas: result.preVerificationGas ? BigInt(result.preVerificationGas) : undefined,
    }
  } catch (error) {
    console.error('❌ Paymaster service error:', error)
    throw error
  }
}

/**
 * Check if user is eligible for gas sponsorship
 * This is where you can implement custom business logic
 */
export async function checkSponsorshipEligibility(
  userOp: Partial<UserOperation>
): Promise<boolean> {
  // Custom business logic examples:
  // - Check daily gas usage limit
  // - Verify transaction type
  // - Check allowlist
  // - Implement rate limiting

  // For now, approve all requests
  return true
}
