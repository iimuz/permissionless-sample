/**
 * Frontend Type Definitions
 */

export type UserOperation = {
  sender: `0x${string}`
  nonce: bigint
  factory?: `0x${string}`
  factoryData?: `0x${string}`
  callData: `0x${string}`
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymaster?: `0x${string}`
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  paymasterData?: `0x${string}`
  signature: `0x${string}`
}

export type UserOperationReceipt = {
  userOpHash: `0x${string}`
  sender: `0x${string}`
  nonce: bigint
  actualGasUsed: bigint
  actualGasCost: bigint
  success: boolean
  receipt: {
    transactionHash: `0x${string}`
    blockNumber: bigint
    blockHash: `0x${string}`
    logs: any[]
  }
}

export type SendTransactionStatus =
  | 'idle'
  | 'creating'
  | 'sponsoring'
  | 'signing'
  | 'submitting'
  | 'polling'
  | 'success'
  | 'error'
