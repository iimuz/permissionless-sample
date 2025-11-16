/**
 * ERC-4337 UserOperation type definitions
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

export type SponsorUserOpRequest = {
  userOp: Partial<UserOperation>
  chainId: number
}

export type SponsorUserOpResponse = {
  success: boolean
  data: {
    paymasterAndData?: `0x${string}`
    paymaster?: `0x${string}`
    paymasterData?: `0x${string}`
    paymasterVerificationGasLimit?: bigint
    paymasterPostOpGasLimit?: bigint
    callGasLimit?: bigint
    verificationGasLimit?: bigint
    preVerificationGas?: bigint
  }
  error?: {
    code: string
    message: string
  }
}

export type SubmitUserOpRequest = {
  userOp: UserOperation
  chainId: number
}

export type SubmitUserOpResponse = {
  success: boolean
  data?: {
    userOpHash: `0x${string}`
    status: 'submitted'
  }
  error?: {
    code: string
    message: string
  }
}

export type GetUserOpStatusResponse = {
  success: boolean
  data?: {
    userOpHash: `0x${string}`
    status: 'pending' | 'confirmed' | 'failed'
    receipt?: UserOperationReceipt
  }
  error?: {
    code: string
    message: string
  }
}
