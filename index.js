require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
const readline = require("readline");

const banner = `
        █████╗ ██╗██████╗ ██████╗ ██████╗  ██████╗ ██████╗      █████╗ ███████╗ ██████╗
        ██╔══██╗██║██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔══██╗    ██╔══██╗██╔════╝██╔════╝
        ███████║██║██████╔╝██║  ██║██████╔╝██║   ██║██████╔╝    ███████║███████╗██║     
        ██╔══██║██║██╔══██╗██║  ██║██╔══██╗██║   ██║██╔═══╝     ██╔══██║╚════██║██║     
        ██║  ██║██║██║  ██║██████╔╝██║  ██║╚██████╔╝██║         ██║  ██║███████║╚██████╗
        ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝         ╚═╝  ╚═╝╚══════╝ ╚═════╝
            Mintair Auto Deploy - BOT                
📢  Telegram Channel: https://t.me/airdropasc`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
const randomDelay = () =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000)
  );

const rpcConfig = JSON.parse(fs.readFileSync("./rpc_config.json"));
const privateKeys = Object.values(process.env).filter((k) => k.startsWith("0x"));

if (privateKeys.length === 0) {
  console.error("No private keys found in .env");
  process.exit(1);
}

function generateTokenInfo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const random = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const name = "Token " + random(6);
  const symbol = random(6);
  return { name, symbol };
}

async function postToMintair(address, txHash, networkName, type) {
  try {
    await axios.post(
      "https://contracts-api.mintair.xyz/api/v1/user/transaction",
      {
        transactionHash: txHash,
        metaData: { name: networkName, type },
      },
      { headers: { "Wallet-Address": address } }
    );
  } catch (error) {
    console.error("Failed to post to Mintair:", error.message);
  }
}

async function deployTimer(wallet, network, abi, bytecode) {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log(`\nDeploying Timer Contract...`);
  try {
    const contract = await factory.deploy();
    await contract.deployed();
    const txHash = contract.deployTransaction.hash;
    console.log("✓ Success!");
    console.log(`  Address: ${contract.address}`);
    console.log(`  Tx Hash: ${txHash}`);
    await postToMintair(wallet.address, txHash, network.name, "Timer");
    return true;
  } catch (error) {
    console.error("Deployment failed:", error.message);
    return false;
  }
}

async function deployERC20(wallet, network, abi, bytecode) {
  const { name, symbol } = generateTokenInfo();
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log(`\nDeploying ${name} (${symbol})...`);
  try {
    const contract = await factory.deploy(name, symbol);
    await contract.deployed();
    const txHash = contract.deployTransaction.hash;
    console.log("✓ Success!");
    console.log(`  Address: ${contract.address}`);
    console.log(`  Tx Hash: ${txHash}`);
    await postToMintair(wallet.address, txHash, network.name, "ERC-20");
    return true;
  } catch (error) {
    console.error("Deployment failed:", error.message);
    return false;
  }
}

async function automatedDeployment() {
  console.log("\n== Available Networks ==");
  rpcConfig.networks.forEach((net, i) => console.log(`${i + 1}. ${net.name} (${net.chainId})`));

  const netIndex = parseInt(await ask("Select network (number): "));
  const network = rpcConfig.networks[netIndex - 1];
  const totalDeployments = parseInt(await ask("How many total contracts to deploy? "));

  if (isNaN(totalDeployments) || totalDeployments < 1) {
    console.error("Invalid deployment count.");
    return;
  }

  // Load ABI and Bytecode
  let timerAbi, timerBytecode, erc20Abi, erc20Bytecode;
  try {
    timerAbi = JSON.parse(fs.readFileSync("./abi/TimerABI.json"));
    const timerBytecodeData = JSON.parse(fs.readFileSync("./bytecode/TimerBytecode.json"));
    timerBytecode = typeof timerBytecodeData === "object" && timerBytecodeData.bytecode ? timerBytecodeData.bytecode : timerBytecodeData;

    if (network.name.toLowerCase().includes("0g")) {
      erc20Abi = JSON.parse(fs.readFileSync("./abi/ABI0G.json"));
      const erc20BytecodeData = JSON.parse(fs.readFileSync("./bytecode/BYTECODE0G.json"));
      erc20Bytecode = typeof erc20BytecodeData === "object" && erc20BytecodeData.bytecode ? erc20BytecodeData.bytecode : erc20BytecodeData;
    } else {
      erc20Abi = JSON.parse(fs.readFileSync("./abi/ERC20ABI.json"));
      const erc20BytecodeData = JSON.parse(fs.readFileSync("./bytecode/ERC20Bytecode.json"));
      erc20Bytecode = typeof erc20BytecodeData === "object" && erc20BytecodeData.bytecode ? erc20BytecodeData.bytecode : erc20BytecodeData;
    }
  } catch (error) {
    console.error("Failed to read ABI/Bytecode file:", error.message);
    return;
  }

  let deploymentsDone = 0;

  while (deploymentsDone < totalDeployments) {
    // Randomly select a wallet
    const walletIndex = Math.floor(Math.random() * privateKeys.length);
    const privateKey = privateKeys[walletIndex];
    const provider = new ethers.providers.JsonRpcProvider(network.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);

    console.log(`\n=== Wallet ${walletIndex + 1}: ${wallet.address} ===`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ${network.ticker}`);

    // Randomly choose between Timer and ERC20
    const isTimer = Math.random() < 0.5;
    const deploySuccess = isTimer
      ? await deployTimer(wallet, network, timerAbi, timerBytecode)
      : await deployERC20(wallet, network, erc20Abi, erc20Bytecode);

    if (deploySuccess) {
      deploymentsDone++;
      console.log(`Progress: ${deploymentsDone}/${totalDeployments} contracts deployed`);
    }

    if (deploymentsDone < totalDeployments) {
      console.log("⏳ Waiting for a random interval (10-30 seconds)...");
      await randomDelay();
    }
  }
}

async function mainMenu() {
  console.log(banner); // Display the banner at the start
  console.log("\n== AUTOMATED CONTRACT DEPLOYMENT ==");
  await automatedDeployment();

  console.log("\n============================================================");
  console.log("                ALL TRANSACTIONS COMPLETED");
  console.log("============================================================");

  const continueTx = (await ask("\nContinue with another deployment? (y/n): ")).toLowerCase();
  if (continueTx !== "y") {
    console.log("\nThank you! Bot stopped.");
    rl.close();
    process.exit(0);
  } else {
    await mainMenu();
  }
}

mainMenu();
