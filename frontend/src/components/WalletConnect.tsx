/**
 * Wallet Connect Component
 * Handles MetaMask connection using wagmi
 */

import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi'
import { toast } from 'sonner'
import { ReactElement } from 'react'
import { formatUnits } from 'viem'
import { TARGET_CHAIN } from '../config/chains'
import { Card, CardContent, CardActions, Typography, Button, List, ListItem } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import { Connector } from 'wagmi'

/*
 * Wallet の接続をおこなうためのコンポーネント
 */
const WalletConnect = (): ReactElement => {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect({
    mutation: {
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`)
      },
    },
  })
  const { disconnect } = useDisconnect({
    mutation: {
      onError: (error) => {
        toast.error(`Failed to disconnect: ${error.message}`)
      },
    },
  })
  const { switchChain, isPending } = useSwitchChain({
    mutation: {
      onError: (error) => {
        toast.error(`Failed to switch network: ${error.message}`)
      },
    },
  });

  // Prefer early returns for clarity.
  if (!isConnected) {
    return <ConnectView connectors={connectors} connect={connect} />;
  }

  if (chainId !== TARGET_CHAIN.id) {
    return <NetworkSwitchView isPending={isPending} switchChain={switchChain} />;
  }

  if (address) {
    return <ConnectedView address={address} disconnect={disconnect} />;
  }

  // Fallback: this should be unreachable in normal operation. Render a small
  // message instead of returning null so the UI is explicit about the state.
  return (
    <Typography variant="body2" color="text.secondary">Unexpected state</Typography>
  );
}

export default WalletConnect;

/*
 * 接した Wallet の chain ID が異なる場合に表示するビュー
 */
const NetworkSwitchView = ({ isPending, switchChain }: {
  isPending: boolean;
  switchChain: (params: { chainId: number }) => void;
}): ReactElement => {
  const onClickSwitch = () => {
    switchChain({ chainId: TARGET_CHAIN.id });
  };
  const getSwitchButtonText = (): string => {
    if (isPending) return 'Switching...';

    return `Switch to ${TARGET_CHAIN.name}`;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>Please switch your network</Typography>
        <Typography variant="body1">
          This application works on the {TARGET_CHAIN.name} network.
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={isPending} onClick={onClickSwitch}>
          {getSwitchButtonText()}
        </Button>
      </CardActions>
    </Card>
  );
}

/*
 * Wallet が接続されているときのビュー
 */
const ConnectedView = ({ address, disconnect }: {
  address: string;
  disconnect: () => void;
}): ReactElement => {
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ address: address as `0x${string}` })
  const explorerUrl = `${TARGET_CHAIN.blockExplorers?.default.url}/address/${address}`

  const getBalanceString = (): string => {
    if (isBalanceLoading) return 'isLoading...';
    if (!balance) return 'N/A';

    const formattedBalance = formatUnits(balance.value, balance.decimals)
    return `${parseFloat(formattedBalance).toFixed(4)} ${balance.symbol}`;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Wallet Connected
        </Typography>
        <List dense>
          <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Network:</Typography>
            {TARGET_CHAIN.name}
          </ListItem>
          <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Address:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{address}</Typography>
          </ListItem>
          <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Balance:</Typography>
            <Typography variant="body2">{getBalanceString()}</Typography>
          </ListItem>
        </List>
      </CardContent>
      <CardActions>
        <Button variant="contained" color="error" onClick={() => disconnect()}>
          Disconnect
        </Button>
        <Button variant="outlined" href={explorerUrl} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />}>
          View on Explorer
        </Button>
      </CardActions>
    </Card>
  );
}

/*
 * Wallet が接続されていない時に接続するためのビュー
 */
const ConnectView = ({ connectors, connect }: {
  connectors: readonly Connector[];
  connect: (args: { connector: Connector }) => void;
}): ReactElement => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Connect Your Wallet</Typography>
        <Typography variant="body2" color="text.secondary">
          Connect MetaMask to create a Smart Account
        </Typography>
      </CardContent>
      <CardActions>
        {connectors.map((connector: Connector) => (
          <Button key={connector.id} variant="contained" onClick={() => connect({ connector })}>
            Connect {connector.name}
          </Button>
        ))}
      </CardActions>
    </Card>
  );
}

