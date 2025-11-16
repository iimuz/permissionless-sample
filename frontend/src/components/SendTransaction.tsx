/**
 * Send Transaction Component
 * Handles test UserOperation submission
 */

import { useState, ReactElement } from 'react'
import { useUserOperation } from '../hooks/useUserOperation'
import useSmartAccount from '../hooks/useSmartAccount'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  List,
  ListItem,
} from '@mui/material'
import type { UserOperationReceipt } from 'permissionless'

const SendTransaction = (): ReactElement => {
  const { smartAccountClient } = useSmartAccount()
  const { sendTransaction, reset, status, userOpHash, receipt, error } = useUserOperation()
  const [isExecuting, setIsExecuting] = useState(false)

  const handleSendTestTransaction = async () => {
    if (!smartAccountClient) {
      alert('Smart Account not ready')
      return
    }

    setIsExecuting(true)
    try {
      // Get Smart Account address for self-call
      const smartAccountAddress = smartAccountClient.account?.address
      if (!smartAccountAddress) {
        throw new Error('Smart Account address not available')
      }
      // Send a self-call (dummy transaction)
      await sendTransaction(smartAccountAddress, 0n, '0x')
    } catch (err) {
      console.error('Transaction failed:', err)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleReset = () => {
    reset()
  }

  if (!smartAccountClient) {
    return <DisabledView />
  }
  if (status === 'error' && error) {
    return <ErrorView error={error} onReset={handleReset} />
  }
  if (status === 'idle') {
    return <IdleView onSend={handleSendTestTransaction} isExecuting={isExecuting} />
  }
  if (status !== 'success') {
    return <ProcessingView status={status} />
  }

  if (status === 'success' && receipt && userOpHash) {
    return <SuccessView userOpHash={userOpHash} receipt={receipt} onReset={handleReset} />
  }

  return (
    <Typography variant="body2" color="text.secondary">Unexpected state</Typography>
  )
}

export default SendTransaction

/*
 * Smart Account 未接続時のビュー
 */
const DisabledView = (): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Send Test Transaction</Typography>
        <Typography variant="body2" color="text.secondary">
          Connect wallet and wait for Smart Account creation first
        </Typography>
      </CardContent>
    </Card>
  )
}

/*
 * 初期状態のビュー
 */
const IdleView = ({ onSend, isExecuting }: {
  onSend: () => void;
  isExecuting: boolean;
}): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Send Test Transaction</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This will send a test UserOperation (self-call) to demonstrate the full AA flow:
          <br />
          Create → Sponsor → Sign → Submit → Confirm
        </Typography>
        <Button variant="contained" onClick={onSend} disabled={isExecuting}>
          Send Test Transaction
        </Button>
      </CardContent>
    </Card>
  )
}

/*
 * 処理中のビュー
 */
const ProcessingView = ({ status }: { status: string }): ReactElement => {
  const getStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      creating: 'Creating UserOperation...',
      sponsoring: 'Getting Paymaster sponsorship...',
      signing: 'Signing UserOperation...',
      submitting: 'Submitting to Bundler...',
      polling: 'Waiting for confirmation...',
    }
    return messages[status] || status
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Send Test Transaction</Typography>
        <Box textAlign="center" py={2}>
          <Typography variant="body1" gutterBottom>
            Status: {getStatusMessage(status)}
          </Typography>
          <CircularProgress />
        </Box>
      </CardContent>
    </Card>
  )
}

/*
 * 成功時のビュー
 */
const SuccessView = ({ userOpHash, receipt, onReset }: {
  userOpHash: `0x${string}`;
  receipt: UserOperationReceipt;
  onReset: () => void;
}): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Send Test Transaction</Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Transaction Successful!</Typography>
        </Alert>
        <List dense>
          <ListItem>
            <Box>
              <Typography variant="body2">
                <strong>UserOp Hash:</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {userOpHash}
              </Typography>
            </Box>
          </ListItem>
          <ListItem>
            <Box>
              <Typography variant="body2">
                <strong>Transaction Hash:</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {receipt.receipt.transactionHash}
              </Typography>
            </Box>
          </ListItem>
          <ListItem>
            <Box>
              <Typography variant="body2">
                <strong>Block Number:</strong> {receipt.receipt.blockNumber.toString()}
              </Typography>
            </Box>
          </ListItem>
          <ListItem>
            <Box>
              <Typography variant="body2">
                <strong>Gas Used:</strong> {receipt.actualGasUsed.toString()}
              </Typography>
            </Box>
          </ListItem>
          <ListItem>
            <Box>
              <Typography variant="body2">
                <strong>Success:</strong> {receipt.success ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </ListItem>
        </List>
        <Button variant="contained" color="success" onClick={onReset}>
          Send Another Transaction
        </Button>
      </CardContent>
    </Card>
  )
}

/*
 * エラー時のビュー
 */
const ErrorView = ({ error, onReset }: {
  error: Error;
  onReset: () => void;
}): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Send Test Transaction</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Transaction Failed</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {error.message}
          </Typography>
        </Alert>
        <Button variant="contained" onClick={onReset}>Try Again</Button>
      </CardContent>
    </Card>
  )
}

