/**
 * Custom Paymaster Actions
 * Provides custom getPaymasterData function for SmartAccountClient
 */

import { type Address, type Hex, toHex } from 'viem'
import type { GetPaymasterDataParameters, GetPaymasterDataReturnType } from 'viem/account-abstraction'

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
 * Custom getPaymasterData function
 * Calls custom backend API for paymaster sponsorship
 */
export async function getPaymasterData(
  parameters: GetPaymasterDataParameters
): Promise<GetPaymasterDataReturnType> {
  console.log('💰 Getting paymaster data...', parameters)

  // Extract UserOperation fields
  const {
    sender,
    nonce,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = parameters

  // Handle both 0.6 and 0.7 formats
  const factory = 'factory' in parameters ? parameters.factory : undefined
  const factoryData = 'factoryData' in parameters ? parameters.factoryData : undefined
  const initCode = 'initCode' in parameters ? parameters.initCode : undefined
  const paymasterVerificationGasLimit =
    'paymasterVerificationGasLimit' in parameters ? parameters.paymasterVerificationGasLimit : undefined
  const paymasterPostOpGasLimit =
    'paymasterPostOpGasLimit' in parameters ? parameters.paymasterPostOpGasLimit : undefined

  // Build UserOperation object for API
  const userOp: any = {
    sender,
    nonce: nonce ? toHex(nonce) : undefined,
    callData,
    callGasLimit: callGasLimit ? toHex(callGasLimit) : undefined,
    verificationGasLimit: verificationGasLimit ? toHex(verificationGasLimit) : undefined,
    preVerificationGas: preVerificationGas ? toHex(preVerificationGas) : undefined,
    maxFeePerGas: maxFeePerGas ? toHex(maxFeePerGas) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : undefined,
  }

  // Add version-specific fields
  if (factory) userOp.factory = factory
  if (factoryData) userOp.factoryData = factoryData
  if (initCode) userOp.initCode = initCode
  if (paymasterVerificationGasLimit) userOp.paymasterVerificationGasLimit = toHex(paymasterVerificationGasLimit)
  if (paymasterPostOpGasLimit) userOp.paymasterPostOpGasLimit = toHex(paymasterPostOpGasLimit)

  // Call custom backend API
  const response = await fetch(`${API_BASE_URL}/api/user-operations/sponsor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userOp,
      chainId: CHAIN_ID,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Sponsorship failed')
  }

  const data = await response.json()
  const sponsorData = data.data

  console.log('✅ Paymaster data received:', sponsorData)

  // Convert response to viem format
  const result: GetPaymasterDataReturnType = {
    paymaster: sponsorData.paymaster as Address,
    paymasterData: sponsorData.paymasterData as Hex,
    paymasterVerificationGasLimit: sponsorData.paymasterVerificationGasLimit
      ? BigInt(sponsorData.paymasterVerificationGasLimit)
      : 0n,
    paymasterPostOpGasLimit: sponsorData.paymasterPostOpGasLimit
      ? BigInt(sponsorData.paymasterPostOpGasLimit)
      : 0n,
  }

  // Add optional gas limits if provided by backend
  if (sponsorData.callGasLimit) {
    ; (result as any).callGasLimit = BigInt(sponsorData.callGasLimit)
  }
  if (sponsorData.verificationGasLimit) {
    ; (result as any).verificationGasLimit = BigInt(sponsorData.verificationGasLimit)
  }
  if (sponsorData.preVerificationGas) {
    ; (result as any).preVerificationGas = BigInt(sponsorData.preVerificationGas)
  }

  return result
}

/**
 * Custom getPaymasterStubData function (for gas estimation)
 * Returns stub values for paymaster fields
 */
export async function getPaymasterStubData(
  parameters: GetPaymasterDataParameters
): Promise<GetPaymasterDataReturnType> {
  console.log('💰 Getting paymaster stub data...', parameters)

  // For estimation, we can return the same data or stub values
  // In this implementation, we'll call the same API
  return getPaymasterData(parameters)
}
