require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const rpcConfig = JSON.parse(fs.readFileSync("./rpc_config.json"));
const privateKeys = Object.values(process.env).filter((k) => k.startsWith("0x"));
if (privateKeys.length === 0) {
  console.error("Tidak ada private key ditemukan di .env");
  process.exit(1);
}
function generateTokenInfo() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const random = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const name = "Token " + random(6);
  const symbol = random(6).toUpperCase();
  return { name, symbol };
}
async function postToMintair(address, txHash, networkName, type) {
  try {
    await axios.post(
      "https://contracts-api.mintair.xyz/api/v1/user/transaction",
      {
        transactionHash: txHash,
        metaData: {
          name: networkName,
          type
        }
      },
      {
        headers: {
          "Wallet-Address": address
        }
      }
    );
  } catch {}
}
async function deployTimer() {
  const abi = JSON.parse(fs.readFileSync("./TimerABI.json"));
  const bytecode = JSON.parse(fs.readFileSync("./TimerBytecode.json")).bytecode;
  console.log("\n== Jaringan yang Tersedia ==");
  rpcConfig.networks.forEach((net, i) => console.log(`${i + 1}. ${net.name} (${net.chainId})`));
  const netIndex = parseInt(await ask("Pilih jaringan (angka): "));
  const network = rpcConfig.networks[netIndex - 1];
  const jumlahDeploy = parseInt(await ask("Berapa kali deploy Timer Contract per wallet? "));
  if (isNaN(jumlahDeploy) || jumlahDeploy < 1) {
    console.error("Jumlah deploy tidak valid.");
    return;
  }
  for (let w = 0; w < privateKeys.length; w++) {
    const privateKey = privateKeys[w];
    const provider = new ethers.providers.JsonRpcProvider(network.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`\n=== Wallet ${w + 1}: ${wallet.address} ===`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    for (let i = 0; i < jumlahDeploy; i++) {
      console.log(`\n[${i + 1}] Deploying Timer Contract...`);
      try {
        const contract = await factory.deploy();
        await contract.deployed();
        const txHash = contract.deployTransaction.hash;
        console.log("✓ Sukses!");
        console.log(`  Address : ${contract.address}`);
        console.log(`  Tx Hash : ${txHash}`);
        await postToMintair(wallet.address, txHash, network.name, "Timer");
      } catch (err) {
        console.error("Deploy gagal:", err.message);
      }
      if (i < jumlahDeploy - 1) {
        console.log("⏳    Menunggu 30 detik sebelum deploy berikutnya...");
        await delay(30000);
      }
    }
    if (w < privateKeys.length - 1) {
      console.log("⏳    Menunggu 30 detik sebelum lanjut ke wallet berikutnya...");
      await delay(30000);
    }
  }
}
async function deployERC20() {
  console.log("\n== Jaringan yang Tersedia ==");
  rpcConfig.networks.forEach((net, i) => console.log(`${i + 1}. ${net.name} (${net.chainId})`));
  const netIndex = parseInt(await ask("Pilih jaringan (angka): "));
  const network = rpcConfig.networks[netIndex - 1];
  let abi, bytecode;
  try {
    if (network.name.toLowerCase().includes("0g")) {
      abi = JSON.parse(fs.readFileSync("./ABI0G.json"));
      bytecode = JSON.parse(fs.readFileSync("./BYTECODE0G.json")).bytecode;
    } else {
      abi = JSON.parse(fs.readFileSync("./ERC20ABI.json"));
      bytecode = JSON.parse(fs.readFileSync("./ERC20Bytecode.json")).bytecode;
    }
  } catch (e) {
    console.error("Gagal membaca file ABI/Bytecode:", e.message);
    return;
  }
  const useAll = (await ask("Gunakan semua wallet? (y/n): ")).toLowerCase() === "y";
  const jumlahDeploy = parseInt(await ask("Berapa kali deploy ERC20 token? "));
  if (isNaN(jumlahDeploy) || jumlahDeploy < 1) {
    console.error("Jumlah deploy tidak valid.");
    return;
  }
  const walletsToUse = useAll
    ? privateKeys
    : [privateKeys[parseInt(await ask(`Pilih wallet (1-${privateKeys.length}): `)) - 1]];
  for (let w = 0; w < walletsToUse.length; w++) {
    const privateKey = walletsToUse[w];
    const provider = new ethers.providers.JsonRpcProvider(network.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`\n=== Wallet ${w + 1}: ${wallet.address} ===`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    for (let i = 0; i < jumlahDeploy; i++) {
      const { name, symbol } = generateTokenInfo();
      console.log(`\n[${i + 1}] Deploying ${name} (${symbol})...`);
      try {
        const contract = await factory.deploy(name, symbol);
        await contract.deployed();
        const txHash = contract.deployTransaction.hash;
        console.log("✓ Sukses!");
        console.log(`  Address : ${contract.address}`);
        console.log(`  Tx Hash : ${txHash}`);
        await postToMintair(wallet.address, txHash, network.name, "ERC-20");
      } catch (err) {
        console.error("Deploy gagal:", err.message);
      }
      if (i < jumlahDeploy - 1) {
        console.log("⏳    Menunggu 30 detik sebelum deploy berikutnya...");
        await delay(30000);
      }
    }
    if (w < walletsToUse.length - 1) {
      console.log("⏳    Menunggu 30 detik sebelum lanjut ke wallet berikutnya...");
      await delay(30000);
    }
  }
}
async function mainMenu() {
  while (true) {
    console.log("\n== PILIH JENIS DEPLOY ==");
    console.log("1. Deploy Timer Contract");
    console.log("2. Deploy ERC20");
    const choice = await ask("Masukkan pilihan: ");
    if (choice === "1") {
      await deployTimer();
    } else if (choice === "2") {
      await deployERC20();
    } else {
      console.log("Pilihan tidak valid.");
      continue;
    }
    console.log("\n============================================================");
    console.log("                SEMUA TRANSAKSI BERHASIL DILAKUKAN");
    console.log("============================================================");
    const lanjut = (await ask("\nLanjut transaksi lagi? (y/n): ")).toLowerCase();
    if (lanjut !== "y") {
      console.log("\nTerima kasih! Bot dihentikan.");
      rl.close();
      process.exit(0);
    }
  }
}
mainMenu();
