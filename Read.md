# ⚡ Verse Merchant OS — Web3 Crypto Merchant Operating System

![Verse Merchant OS Banner](https://img.shields.io/badge/Verse%20Merchant%20OS-Web3%20Merchant%20Invoicing-7c3aed?style=for-the-badge&logo=polygon&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Polygon Network](https://img.shields.io/badge/Polygon-Mainnet%20(Chain%20137)-8247e5?style=for-the-badge&logo=polygon&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**Verse Merchant OS** is a full-stack, enterprise-grade Web3 merchant operating system, crypto invoicing, and decentralized payment platform built for modern businesses, freelancers, agencies, and global e-commerce. Powered by **Polygon Mainnet**, **Wagmi**, **Viem**, **Reown AppKit**, and **MongoDB**, Verse Merchant OS enables instant cross-border settlement in native **POL**, **USDC**, and **VERSE** tokens with real-time live market exchange rates.

---

## 🌟 Key Features

### 🔐 1. Web3 SIWE Authentication & Profile Management
- **Sign-In with Ethereum (SIWE)**: Cryptographic nonce-based wallet sign-in with signature verification (`/api/auth/*`).
- **Zero Password Required**: Multi-merchant profile creation directly linked to Web3 EVM wallet addresses.
- **Session Management**: Secure HTTP-only cookie session handling with instant logout and session persistence.

### 📄 2. Complete Merchant Invoicing Suite
- **Invoice Lifecycle Management**: Create, edit, draft, issue, track, cancel, and audit invoices seamlessly.
- **Rich Line-Item Engine**: Custom itemization, unit quantities, subtotal calculation, adjustable tax rates, discounts, and terms/notes.
- **Multi-Currency Base Options**: Issue invoices in standard fiat references (**USD**, **EUR**, **GBP**, **INR**, etc.) converted dynamically to crypto at checkout.
- **Status Tracking**: Visual badge indicators for `draft`, `open`, `paid`, `overdue`, and `cancelled` states.

### 📈 3. Live Real-Time Multi-Exchange Price Feed
- **100% Volatility-Safe Dynamic Pricing**: Zero hardcoded static prices or arbitrary baseline assumptions. Exchange rates are fetched directly from live multi-exchange market aggregators (CoinGecko, DexScreener, Binance, CryptoCompare).
- **Multi-Token Settlement**: Accept payments in:
  - 🟣 **POL** (Native Polygon Gas & Settlement Token)
  - 💵 **USDC** (Circle USD Stablecoin on Polygon)
  - 🪐 **VERSE** (Bitcoin.com Ecosystem & Rewards Token)
- **Automatic Multi-Decimal Precision**: Auto-formats 18-decimal and 6-decimal token transactions with raw unit conversions.

### 💳 4. Public Shareable Payment Portal (`/pay/[id]`)
- **Dedicated Client Checkout**: Clients receive clean, shareable public payment URLs (`/pay/INV-XXXX`).
- **One-Click Web3 Wallet Pay**: Built-in support for **MetaMask**, **Coinbase Wallet**, **Rainbow**, and **WalletConnect** via Reown AppKit.
- **EIP-681 & Address QR Codes**: Multi-tab QR code generator supporting raw wallet addresses, checkout URLs, and formatted EIP-681 Web3 deep links.

### 🛡️ 5. Creator Settlement Verification & Security
- **Creator-Controlled "I Received" Settlement**: Direct wallet-settlement confirmation button for merchants to safely mark invoices as **Paid** upon verifying incoming funds in their wallet.
- **Manual TxHash On-Chain Verification**: Verify transaction hash against Polygon RPC endpoints to confirm block confirmation status.
- **Audit Logging & Security**: Audit logging (`AppLogger`) tracks security events, authentication attempts, and payment updates.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology / Library |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Web3 Provider & Hooks** | [Wagmi v3](https://wagmi.sh/), [Viem v2](https://viem.sh/), [Reown AppKit v1](https://reown.com/) |
| **Payment Protocol** | [@x402/core](https://www.npmjs.com/package/@x402/core), [@x402/evm](https://www.npmjs.com/package/@x402/evm), [@x402/svm](https://www.npmjs.com/package/@x402/svm) |
| **Database** | [MongoDB Native Driver v7](https://www.mongodb.com/) |
| **QR Generation** | `qrcode.react` |
| **Effects** | `canvas-confetti` (for payment completion celebrations) |

---

## 📁 Directory & Project Structure

```
verse-merchant-os/
├── app/
│   ├── api/                      # Full-stack API routes
│   │   ├── auth/                 # SIWE nonce, verify, me, profile, logout
│   │   ├── invoices/             # CRUD, status updates, mark-received, verify-onchain
│   │   ├── payments/             # Transaction history & recorded payments
│   │   ├── prices/               # Live multi-exchange price feed proxy
│   │   └── health/               # System & DB health checks
│   ├── dashboard/                # Merchant dashboard (Invoices, Customers, Settings)
│   ├── pay/[id]/                 # Public client shareable payment checkout
│   ├── login/                    # Web3 SIWE login page
│   ├── globals.css               # Tailwind CSS imports
│   ├── layout.tsx                # Root layout & Web3 context providers
│   └── page.tsx                  # Public landing & feature showcase
├── components/
│   ├── invoices/                 # Invoice form, list, detail, status badges
│   ├── payments/                 # QR payment modal, payment prep, token selector
│   ├── providers/                # Reown AppKit & Wagmi Web3 providers
│   └── ui/                       # Reusable buttons, modals, toasts, cards
├── lib/
│   ├── db/                       # MongoDB client & repository layer
│   ├── payments/                 # Price calculator, token definitions, RPC configs
│   ├── auth/                     # Nonce generator, SIWE validator, session cookies
│   └── utils.ts                  # Currency formatters & helpers
├── types/                        # TypeScript interfaces (Invoice, Payment, User)
└── public/                       # Static branding & assets
```

---

## 📡 API Reference Overview

### 🔐 Authentication Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/nonce` | Generates a secure cryptographic SIWE nonce for wallet signing |
| `POST` | `/api/auth/verify` | Validates EIP-4361 wallet signature & establishes session cookie |
| `GET` | `/api/auth/me` | Returns current authenticated merchant profile |
| `PUT` | `/api/auth/profile` | Updates merchant business profile & settlement wallet address |
| `POST` | `/api/auth/logout` | Clears authentication session cookie |

### 📄 Invoices & Payments Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | List all invoices for the authenticated merchant |
| `POST` | `/api/invoices` | Create a new crypto invoice |
| `GET` | `/api/invoices/[id]` | Fetch single invoice details by ID or Invoice Number |
| `PUT` | `/api/invoices/[id]` | Update draft invoice details |
| `DELETE` | `/api/invoices/[id]` | Soft-delete / cancel invoice |
| `POST` | `/api/invoices/[id]/mark-received` | Merchant action to mark invoice as paid upon verifying wallet funds |
| `POST` | `/api/invoices/[id]/verify-onchain` | Verify on-chain transaction hash against Polygon RPCs |
| `GET` | `/api/prices` | Real-time live market exchange rate aggregator |

---

## ⚙️ Environment Variables Setup

Create a `.env.local` or `.env` file in the project root:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/verse_merchant_os?retryWrites=true&w=majority

# Web3 / Reown AppKit Project ID (from https://cloud.reown.com)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id_here

# Polygon Mainnet RPC URL (Optional fallback RPC)
POLYGON_RPC_URL=https://polygon-rpc.com

# Session Secret (Required for SIWE cookie encryption)
SESSION_SECRET=your_32_character_random_session_secret_key
```

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🔄 Payment Lifecycle Workflow

```
[Merchant] ➔ Creates Invoice (USD/EUR/etc.)
     │
     ├── Generates Shareable Payment Link (`/pay/INV-1001`)
     │
[Customer] ➔ Opens Payment Link
     │
     ├── Selects Payment Token (POL / USDC / VERSE)
     ├── Live Market Price Feed Fetched (Real-time Exchange Rate)
     │
     ├── Option A: Connects Web3 Wallet & Pays On-Chain (MetaMask / Reown)
     └── Option B: Scans EIP-681 QR Code with Mobile Wallet
     │
[Merchant] ➔ Receives On-Chain Funds in Wallet
     │
     └── Clicks "I Received Payment" ➔ Invoice Status Updated to [PAID] ✨
```

---

## 🔒 Security Highlights

1. **Server-Side API Authentication**: All sensitive merchant actions check HTTP-only JWT/Session cookies verified on the server side.
2. **On-Chain Verification**: Transaction hashes are verified using `viem` public client against Polygon RPCs.
3. **No Baseline Assumptions**: Zero hardcoded static prices for volatile assets; real-time pricing ensures zero slippage or loss.
4. **Data Privacy**: Customer payment details and invoice records are tied strictly to authenticated merchant IDs.

---

<p align="center">
  <b>Verse Merchant OS — Built with ❤️ for Web3 Decentralized Commerce on Polygon</b>
</p>
