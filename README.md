# Mintair Bot Deploy

Bot otomatis untuk melakukan deploy kontrak **Timer** dan **ERC-20 Token** ke jaringan blockchain melalui Mintair. Mendukung multi-wallet, pelaporan ke API Mintair, serta delay otomatis antar transaksi.

## Fitur
- Pilihan jenis kontrak: **Timer Contract** atau **ERC-20 Token**
- Dukungan **multi-wallet**
- Pemilihan jaringan dari `rpc_config.json`
- Delay otomatis antar deploy (30 detik) dan antar wallet
- Integrasi API Mintair untuk pelaporan transaksi agar tampil di UI
- Dukungan khusus untuk jaringan seperti **0g Testnet**

## Struktur File

| File                  | Keterangan                                           |
|-----------------------|------------------------------------------------------|
| `.env`                | Private key wallet (contoh: `PRIVATE_KEY_1=...`)     |
| `index.js`            | Script utama bot deploy                              |
| `rpc_config.json`     | Konfigurasi jaringan RPC dan chain ID                |
| `TimerABI.json`       | ABI kontrak Timer                                     |
| `TimerBytecode.json`  | Bytecode kontrak Timer                                |
| `ERC20ABI.json`       | ABI kontrak ERC-20                                     |
| `ERC20Bytecode.json`  | Bytecode kontrak ERC-20                                |
| `ABI0G.json`          | ABI untuk ERC-20 di jaringan 0g Testnet               |
| `BYTECODE0G.json`     | Bytecode untuk ERC-20 di jaringan 0g Testnet          |

## Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/hnfdm/mintair-asc.git && cd mintair-asc
```
```bash
npm install
```
```bash
nano.env
```
PRIVATE_KEY_1=0xabc123...
PRIVATE_KEY_2=0xdef456...
```bash
node index.js
```
