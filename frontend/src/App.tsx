/**
 * Main App Component
 * Configures wagmi and React Query
 */

import { createConfig, http, injected, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { Container, Stack, Typography, Link, Divider } from '@mui/material'
import { TARGET_CHAIN } from './config/chains'
import WalletConnect from './components/WalletConnect'
import SmartAccountInfo from './components/SmartAccountInfo'
import SendTransaction from './components/SendTransaction'
import { ReactElement } from 'react'

// Wagmi configuration
const config = createConfig({
  chains: [TARGET_CHAIN],
  connectors: [injected()],
  transports: {
    [TARGET_CHAIN.id]: http(),
  },
})

// React Query client
const queryClient = new QueryClient()

// MUI theme
const theme = createTheme()

/*
 * App コンポーネント
 */
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Container maxWidth="md">
            <Stack spacing={5} sx={{ py: 2.5 }}>
              <AppHeaderView />

              <Stack component="main" spacing={2.5}>
                <WalletConnect />
                <SmartAccountInfo />
                <SendTransaction />
              </Stack>

              <AppFooterView />
            </Stack>
          </Container>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}

export default App;

/*
 * Header View
 */
const AppHeaderView = (): ReactElement => {
  return (
    <Stack component="header" spacing={2} alignItems="center">
      <Typography variant="h4" component="h1" gutterBottom>
        Account Abstraction with permissionless.js
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Soneium Minato Testnet / Simple Smart Account
      </Typography>
      <Divider flexItem />
    </Stack>
  )
}

/*
 * Footer コンポーネント
 */
const AppFooterView = (): ReactElement => {
  return (
    <Stack component="footer" spacing={2} alignItems="center">
      <Divider flexItem />
      <Typography variant="body2" color="text.secondary" align="center">
        Built with{' '}
        <Link href="https://docs.pimlico.io/permissionless" target="_blank" rel="noopener noreferrer">
          permissionless.js
        </Link>
        {' • '}
        <Link href="https://viem.sh" target="_blank" rel="noopener noreferrer">
          viem
        </Link>
        {' • '}
        <Link href="https://wagmi.sh" target="_blank" rel="noopener noreferrer">
          wagmi
        </Link>
      </Typography>
    </Stack>
  )
}


