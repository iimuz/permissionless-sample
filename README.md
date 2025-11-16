# Permissionless.js AA Sample

Account Abstraction sample application using **permissionless.js** and **viem** on Soneium Minato testnet.

This project demonstrates a complete ERC-4337 Account Abstraction implementation with:

- Simple Smart Account creation
- Paymaster integration for gas sponsorship
- Bundler integration for UserOperation submission
- Backend API for secure Paymaster/Bundler management
- Frontend UI for MetaMask connection and transaction flow

## 🚀 Quick Start

### Prerequisites

1. Node.js 22
2. MetaMask browser extension installed
3. Paymaster and Bundler services

### Setup and Run

#### Backend Setup

```bash
cd backend
npm install
cp .env.sample .env
```

Edit `backend/.env` and set your API keys.
Start backend server:

```bash
npm run dev
```

The backend server will start at `http://localhost:3001`.

Expected output:

```
🚀 Account Abstraction Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: development
  Port:        3001
  CORS:        http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Health Check: http://localhost:3001/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
cp .env.sample .env
npm run dev
```

The browser will automatically open at `http://localhost:3000`.

1. Click "Connect MetaMask" to connect your wallet
1. Wait for Smart Account creation
1. Click "Send Test Transaction" to execute the full UserOperation flow
1. Monitor the progress and view transaction receipt

## 📖 Project Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend                                                    │
│ - MetaMask connection (wagmi)                               │
│ - Smart Account creation (permissionless.js)                │
│ - UserOperation creation & signing                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST API
                   │   POST /api/user-operations/sponsor
                   │   POST /api/user-operations
                   │   GET  /api/user-operations/:hash
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend                                                     │
│ - UserOperation validation                                  │
│ - Paymaster integration (gas sponsorship)                   │
│ - Bundler submission                                        │
└──────────────────┬────────────────┬─────────────────────────┘
                   │                │
                   ↓                ↓
               Paymaster         Bundler
         (Soneium Minato)      (Soneium Minato)
                   │                │
                   └────────┬───────┘
                            ↓
                  Soneium Minato Blockchain
                  (ERC-4337 EntryPoint)
```

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🔗 References

- [permissionless.js Documentation](https://docs.pimlico.io/permissionless)
- [viem Documentation](https://viem.sh)
- [wagmi Documentation](https://wagmi.sh)
- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Soneium](https://soneium.org/)
