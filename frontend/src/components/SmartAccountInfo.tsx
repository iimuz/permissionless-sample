/**
 * Smart Account Info Component
 * Displays Smart Account details
 */

import useSmartAccount from '../hooks/useSmartAccount'
import { useEffect, useState, ReactElement } from 'react'
import { Card, CardContent, Typography, List, ListItem, Alert } from '@mui/material'

/*
 * Smart Account のメインコンポーネント
 */
const SmartAccountInfo = (): ReactElement | null => {
  const { smartAccount, isLoading, error, eoaAddress } = useSmartAccount()
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null)

  useEffect(() => {
    if (!smartAccount) {
      setSmartAccountAddress(null)
      return
    }

    smartAccount.getAddress().then(setSmartAccountAddress)
  }, [smartAccount])

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  if (smartAccount && smartAccountAddress && eoaAddress) {
    return <SmartAccountReadyView eoaAddress={eoaAddress} smartAccountAddress={smartAccountAddress} />;
  }

  return (
    <Typography variant="body2" color="text.secondary">Waiting for Smart Account setup</Typography>
  )
}

export default SmartAccountInfo;

/*
 * ローディング中のビュー
 */
const LoadingView = (): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Creating Smart Account...</Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we create your Smart Account
        </Typography>
      </CardContent>
    </Card>
  )
}

/*
 * エラー時のビュー
 */
const ErrorView = ({ error }: { error: Error }): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Error</Typography>
        <Alert severity="error">{error.message}</Alert>
      </CardContent>
    </Card>
  )
}

/*
 * Smart Account 作成完了時のビュー
 */
const SmartAccountReadyView = ({ eoaAddress, smartAccountAddress }: {
  eoaAddress: string;
  smartAccountAddress: string;
}): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Smart Account Ready</Typography>
        <List dense>
          <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">EOA Address:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {eoaAddress}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Smart Account Address:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {smartAccountAddress}
            </Typography>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  )
}
