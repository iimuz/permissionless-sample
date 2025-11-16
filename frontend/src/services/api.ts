/**
 * Backend API Client
 */

import type { UserOperation, UserOperationReceipt } from '../types/userOperation'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 1946

/**
 * Convert BigInt values to strings for JSON serialization
 */
function serializeUserOp(userOp: Partial<UserOperation>): any {
  return {
    ...userOp,
    nonce: userOp.nonce?.toString(),
    callGasLimit: userOp.callGasLimit?.toString(),
    verificationGasLimit: userOp.verificationGasLimit?.toString(),
    preVerificationGas: userOp.preVerificationGas?.toString(),
    maxFeePerGas: userOp.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas?.toString(),
    paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit?.toString(),
    paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit?.toString(),
  }
}

/**
 * Get Paymaster sponsorship for UserOperation
 */
export async function sponsorUserOperation(
  userOp: Partial<UserOperation>
): Promise<{
  paymaster?: `0x${string}`
  paymasterData?: `0x${string}`
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  callGasLimit?: bigint
  verificationGasLimit?: bigint
  preVerificationGas?: bigint
}> {
  const response = await fetch(`${API_BASE_URL}/api/user-operations/sponsor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userOp: serializeUserOp(userOp),
      chainId: CHAIN_ID,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Sponsorship failed')
  }

  const data = await response.json()

  // Convert string values back to BigInt
  return {
    ...data.data,
    paymasterVerificationGasLimit: data.data.paymasterVerificationGasLimit
      ? BigInt(data.data.paymasterVerificationGasLimit)
      : undefined,
    paymasterPostOpGasLimit: data.data.paymasterPostOpGasLimit
      ? BigInt(data.data.paymasterPostOpGasLimit)
      : undefined,
    callGasLimit: data.data.callGasLimit
      ? BigInt(data.data.callGasLimit)
      : undefined,
    verificationGasLimit: data.data.verificationGasLimit
      ? BigInt(data.data.verificationGasLimit)
      : undefined,
    preVerificationGas: data.data.preVerificationGas
      ? BigInt(data.data.preVerificationGas)
      : undefined,
  }
}

/**
 * Submit UserOperation to Bundler
 */
export async function submitUserOperation(
  userOp: UserOperation
): Promise<`0x${string}`> {
  const response = await fetch(`${API_BASE_URL}/api/user-operations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userOp: serializeUserOp(userOp),
      chainId: CHAIN_ID,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Submission failed')
  }

  const data = await response.json()
  return data.data.userOpHash
}

/**
 * Get UserOperation status and receipt
 */
export async function getUserOperationStatus(
  userOpHash: `0x${string}`
): Promise<{
  userOpHash: `0x${string}`
  status: 'pending' | 'confirmed' | 'failed'
  receipt?: UserOperationReceipt
}> {
  const response = await fetch(`${API_BASE_URL}/api/user-operations/${userOpHash}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Status check failed')
  }

  const data = await response.json()
  return data.data
}
