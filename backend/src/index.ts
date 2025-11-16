/**
 * Express Server
 * Account Abstraction backend using permissionless.js
 */

// Add a toJSON method to BigInt so that it can be serialized to JSON
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

import express from 'express'
import cors from 'cors'
import userOperationRoutes from './routes/userOperation.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      paymaster: process.env.PAYMASTER_URL ? 'configured' : 'not configured',
      bundler: process.env.BUNDLER_URL ? 'configured' : 'not configured',
    },
    chain: {
      id: 1946,
      name: 'Soneium Minato',
      rpc: process.env.RPC_URL || 'https://rpc.minato.soneium.org',
    },
  })
})

// API routes
app.use('/api/user-operations', userOperationRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log('🚀 Account Abstraction Backend Server Started')
  console.log('━'.repeat(60))
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`  Port:        ${PORT}`)
  console.log(`  CORS:        ${ALLOWED_ORIGINS.join(', ')}`)
  console.log('━'.repeat(60))
  console.log(`  Health Check: http://localhost:${PORT}/health`)
  console.log('━'.repeat(60))
  console.log('\n📡 Ready to handle UserOperations!')
})
