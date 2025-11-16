/**
 * UserOperation Routes
 * API endpoints for Account Abstraction operations
 */

import express from 'express'
import { defineChain } from 'viem'
import { getPaymasterData, checkSponsorshipEligibility } from '../services/paymasterService.js'
import { sendUserOperation, getUserOperationReceipt } from '../services/bundlerService.js'
import { validateRequest, sponsorRequestSchema, submitRequestSchema } from '../middleware/validator.js'
import { ApiError } from '../middleware/errorHandler.js'
import type { SponsorUserOpRequest, SubmitUserOpRequest, UserOperation } from '../types/userOperation.js'

const router = express.Router()

// Soneium Minato chain definition
const soneiumMinato = defineChain({
  id: 1946,
  name: 'Soneium Minato',
  network: 'soneium-minato',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL || 'https://rpc.minato.soneium.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Soneium Explorer',
      url: 'https://explorer-testnet.soneium.org',
    },
  },
  testnet: true,
})

/**
 * POST /api/user-operations/sponsor
 * Get Paymaster sponsorship for UserOperation
 */
router.post(
  '/sponsor',
  validateRequest(sponsorRequestSchema),
  async (req, res, next) => {
    try {
      const { userOp, chainId } = req.body as SponsorUserOpRequest

      // Normalize userOp fields to BigInt
      const normalizedUserOp: Partial<UserOperation> = {
        ...userOp,
        nonce: userOp.nonce ? BigInt(userOp.nonce) : undefined,
        callGasLimit: userOp.callGasLimit ? BigInt(userOp.callGasLimit) : undefined,
        verificationGasLimit: userOp.verificationGasLimit ? BigInt(userOp.verificationGasLimit) : undefined,
        preVerificationGas: userOp.preVerificationGas ? BigInt(userOp.preVerificationGas) : undefined,
        maxFeePerGas: userOp.maxFeePerGas ? BigInt(userOp.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas ? BigInt(userOp.maxPriorityFeePerGas) : undefined,
      }

      // Verify chainId matches Soneium Minato
      if (chainId !== 1946) {
        throw new ApiError('Invalid chainId. Only Soneium Minato (1946) is supported.', 400, 'INVALID_CHAIN')
      }

      // Check sponsorship eligibility (custom business logic)
      const isEligible = await checkSponsorshipEligibility(normalizedUserOp)
      if (!isEligible) {
        throw new ApiError('Not eligible for gas sponsorship', 403, 'SPONSORSHIP_DENIED')
      }

      // Get paymaster data from Startale
      const paymasterData = await getPaymasterData(normalizedUserOp, soneiumMinato)

      res.json({
        success: true,
        data: paymasterData,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/user-operations
 * Submit signed UserOperation to Bundler
 */
router.post(
  '/',
  validateRequest(submitRequestSchema),
  async (req, res, next) => {
    try {
      const { userOp, chainId } = req.body as SubmitUserOpRequest

      // Verify chainId
      if (chainId !== 1946) {
        throw new ApiError('Invalid chainId. Only Soneium Minato (1946) is supported.', 400, 'INVALID_CHAIN')
      }

      // Convert string/number values to BigInt
      const normalizedUserOp: UserOperation = {
        ...userOp,
        nonce: typeof userOp.nonce === 'bigint' ? userOp.nonce : BigInt(userOp.nonce),
        callGasLimit: typeof userOp.callGasLimit === 'bigint' ? userOp.callGasLimit : BigInt(userOp.callGasLimit),
        verificationGasLimit: typeof userOp.verificationGasLimit === 'bigint' ? userOp.verificationGasLimit : BigInt(userOp.verificationGasLimit),
        preVerificationGas: typeof userOp.preVerificationGas === 'bigint' ? userOp.preVerificationGas : BigInt(userOp.preVerificationGas),
        maxFeePerGas: typeof userOp.maxFeePerGas === 'bigint' ? userOp.maxFeePerGas : BigInt(userOp.maxFeePerGas),
        maxPriorityFeePerGas: typeof userOp.maxPriorityFeePerGas === 'bigint' ? userOp.maxPriorityFeePerGas : BigInt(userOp.maxPriorityFeePerGas),
        paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit
          ? (typeof userOp.paymasterVerificationGasLimit === 'bigint' ? userOp.paymasterVerificationGasLimit : BigInt(userOp.paymasterVerificationGasLimit))
          : undefined,
        paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit
          ? (typeof userOp.paymasterPostOpGasLimit === 'bigint' ? userOp.paymasterPostOpGasLimit : BigInt(userOp.paymasterPostOpGasLimit))
          : undefined,
      }

      // Submit to Bundler
      const userOpHash = await sendUserOperation(normalizedUserOp)

      res.json({
        success: true,
        data: {
          userOpHash,
          status: 'submitted',
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/user-operations/:hash
 * Get UserOperation status and receipt
 */
router.get('/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params

    // Validate hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      throw new ApiError('Invalid UserOperation hash format', 400, 'INVALID_HASH')
    }

    const userOpHash = hash as `0x${string}`
    const receipt = await getUserOperationReceipt(userOpHash)

    if (!receipt) {
      return res.json({
        success: true,
        data: {
          userOpHash,
          status: 'pending',
        },
      })
    }

    res.json({
      success: true,
      data: {
        userOpHash,
        status: receipt.success ? 'confirmed' : 'failed',
        receipt,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
