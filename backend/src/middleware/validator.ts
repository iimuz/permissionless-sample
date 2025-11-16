/**
 * Request Validation Middleware
 */

import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { ApiError } from './errorHandler.js'

const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]*$/)
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/)

const userOperationSchema = z.object({
  sender: addressSchema,
  nonce: z.union([z.bigint(), z.string(), z.number()]),
  factory: addressSchema.optional(),
  factoryData: hexStringSchema.optional(),
  callData: hexStringSchema,
  callGasLimit: z.union([z.bigint(), z.string(), z.number()]),
  verificationGasLimit: z.union([z.bigint(), z.string(), z.number()]),
  preVerificationGas: z.union([z.bigint(), z.string(), z.number()]),
  maxFeePerGas: z.union([z.bigint(), z.string(), z.number()]),
  maxPriorityFeePerGas: z.union([z.bigint(), z.string(), z.number()]),
  paymaster: addressSchema.optional(),
  paymasterVerificationGasLimit: z.union([z.bigint(), z.string(), z.number()]).optional(),
  paymasterPostOpGasLimit: z.union([z.bigint(), z.string(), z.number()]).optional(),
  paymasterData: hexStringSchema.optional(),
  signature: hexStringSchema.optional(),
})

export const sponsorRequestSchema = z.object({
  userOp: userOperationSchema.partial(),
  chainId: z.number().positive(),
})

export const submitRequestSchema = z.object({
  userOp: userOperationSchema,
  chainId: z.number().positive(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(
          `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400,
          'VALIDATION_ERROR'
        )
      }
      next(error)
    }
  }
}
