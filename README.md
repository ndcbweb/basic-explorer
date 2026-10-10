# basic-explorer

Block explorer for Nadcab EVM chains, built with Next.js and Tailwind CSS. It reads straight from a geth node over JSON-RPC and keeps a small SQLite index (Node's built-in `node:sqlite`) for lists and address history, so it runs comfortably next to an archive node on a small server.

## Features

- Home dashboard with live stats, 14-day transaction chart, latest blocks and transactions
- Blocks, block detail (Clique PoA signer recovered from `extraData`)
- Transactions, transaction detail with fees, gas, decoded ERC-20 input and event logs
- Addresses with balance, transaction history, token transfers, token holdings and contract bytecode
- ERC-20 / ERC-721 token tracker with transfers and holders
- Top accounts and PoA validators
- Search by block number, block hash, transaction hash, address or token symbol

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `RPC_URL` | `http://127.0.0.1:8545` | JSON-RPC endpoint (archive node recommended) |
| `CHAIN_NAME` | `Nadcab Chain` | Display name |
| `CHAIN_ID` | — | Shown in the header and footer |
| `CURRENCY_SYMBOL` | `ETH` | Native currency symbol |
| `DATA_DIR` | `./data` | Where the SQLite index lives |
| `PORT` | `3000` | HTTP port |

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
RPC_URL=http://127.0.0.1:8545 npm run dev
```

## Release bundle

Every push to `main` builds a standalone bundle and uploads it to the rolling `latest` release:

```bash
curl -fsSL https://github.com/ndcbweb/basic-explorer/releases/download/latest/explorer.tar.gz | tar xz
RPC_URL=http://127.0.0.1:8545 PORT=80 DATA_DIR=/var/lib/explorer ./explorer/run.sh
```

Nadcab Console trial deployments download this bundle onto the explorer host and run it in a `node:22-alpine` container.
