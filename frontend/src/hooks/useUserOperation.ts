/**
 * UserOperation Hook
 * Handles E2E UserOperation flow using SmartAccountClient
 */

import { useState } from 'react'
import useSmartAccount from './useSmartAccount'
import type { SendTransactionStatus, UserOperationReceipt } from '../types/userOperation'

export function useUserOperation() {
  const { smartAccountClient } = useSmartAccount()
  const [status, setStatus] = useState<SendTransactionStatus>('idle')
  const [userOpHash, setUserOpHash] = useState<`0x${string}` | null>(null)
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const sendTransaction = async (to: `0x${string}`, value: bigint = 0n, data: `0x${string}` = '0x') => {
    if (!smartAccountClient || !smartAccountClient.account || !smartAccountClient.chain) {
      throw new Error('Smart Account Client, account, or chain not initialized')
    }

    try {
      setStatus('creating')
      setError(null)
      setUserOpHash(null)
      setReceipt(null)

      console.log('🚀 Sending transaction via SmartAccountClient...')
      console.log('   To:', to)
      console.log('   Value:', value.toString())
      console.log('   Data:', data)

      // Send UserOperation using calls array
      // This will:
      // 1. Create UserOperation (with factory if needed)
      // 2. Get paymaster sponsorship (via our custom getPaymasterData)
      // 3. Sign UserOperation
      // 4. Submit to bundler (via our custom bundler transport)
      // Returns: userOpHash
      setStatus('submitting')
      const userOpHash = await smartAccountClient.sendUserOperation({
        account: smartAccountClient.account,
        calls: [{
          to,
          value,
          data,
        }],
      })

      setUserOpHash(userOpHash)
      console.log(`✅ UserOperation submitted! UserOpHash: ${userOpHash}`)

      // Wait for the UserOperation to be confirmed
      setStatus('polling')
      console.log('⏳ Waiting for confirmation...')

      const txReceipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash,
        pollingInterval: 3_000,
      })

      console.log('✅ Transaction confirmed!')
      console.log('   Transaction Hash:', txReceipt.receipt.transactionHash)
      console.log('   Block Number:', txReceipt.receipt.blockNumber.toString())

      // Convert viem receipt to our custom format
      const finalReceipt: UserOperationReceipt = {
        userOpHash,
        sender: txReceipt.sender,
        nonce: txReceipt.nonce,
        actualGasUsed: txReceipt.actualGasUsed,
        actualGasCost: txReceipt.actualGasCost,
        success: txReceipt.success,
        receipt: {
          transactionHash: txReceipt.receipt.transactionHash,
          blockNumber: txReceipt.receipt.blockNumber,
          blockHash: txReceipt.receipt.blockHash,
          logs: txReceipt.receipt.logs,
        },
      }

      setReceipt(finalReceipt)
      setStatus('success')

      return {
        userOpHash,
        receipt: finalReceipt,
      }
    } catch (err) {
      console.error('❌ UserOperation error:', err)
      setStatus('error')
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }

  const reset = () => {
    setStatus('idle')
    setUserOpHash(null)
    setReceipt(null)
    setError(null)
  }

  return {
    sendTransaction,
    reset,
    status,
    userOpHash,
    receipt,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  }
}
