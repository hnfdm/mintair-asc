### Mintair Auto Deploy Bot

An automated Node.js bot for deploying **Timer Contracts** and **ERC-20 Tokens** to blockchain networks via the Mintair platform.

### Features
- **Random Contract Deployment**: Deploys either a **Timer Contract** or an **ERC-20 Token** randomly for a specified number of deployments.
- **Multi-Wallet Support**: Utilizes multiple wallets from the `.env` file, selecting them randomly for each deployment.
- **Network Selection**: Supports multiple blockchain networks defined in `rpc_config.json`.
- **Randomized Delay**: Introduces a random delay of 10–30 seconds between deployments to avoid rate-limiting and ensure smooth operation.
- **Dynamic Ticker**: Displays wallet balances using the network's native ticker (e.g., STT for Somnia Shannon Testnet).
- **Mintair Integration**: Automatically logs deployed contract transactions to the Mintair API.

### Installation

### 1. Clone Repository
```bash
git clone https://github.com/hnfdm/mintair-asc.git && cd mintair-asc
```

### 2. Install Node Module
```bash
npm install
```

### 3. Setup Env (Private Key)
```bash
nano.env
```

### 4. Start Bot

```bash
node index.js
```
