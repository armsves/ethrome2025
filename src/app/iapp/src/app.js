import fs from 'node:fs/promises';
import figlet from 'figlet';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';
// added ethers v6 imports
import { Wallet, Contract, JsonRpcProvider, parseUnits, solidityPackedKeccak256, randomBytes } from 'ethers';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/node';
import { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } from "@1inch/cross-chain-sdk";
import { Web3 } from 'web3';

// TODO write formal bug for this function being inaccessible
function getRandomBytes32() {
    // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

// helper to send ERC20 using ethers v6
const sendErc20 = async ({
  rpcUrl,
  privateKeyFrom,
  to,
  tokenAddress,
  amount, // as decimal string, e.g. "1.5"
  decimals = 18,
}) => {
  if (!rpcUrl || !privateKeyFrom || !to || !tokenAddress || !amount) {
    throw new Error('Missing ERC20 transfer parameters');
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKeyFrom, provider);
  const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
  const erc7984Abi = ['function confidentialTransfer(address to, bytes32 amount) returns (bytes)'];
  //"confidentialTransfer(address,bytes32,bytes)"
  const token = new Contract(tokenAddress, erc20Abi, wallet);

  const value = parseUnits(amount, decimals);
  const tx = await token.transfer(to, value);
  console.log('ERC20 transfer submitted, txHash:', tx.hash);
  const receipt = await tx.wait();
  console.log('ERC20 transfer mined, status:', receipt.status);
  return { txHash: tx.hash, receipt };
};

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};
  let secretTransferResults = ''; // Store secret transfer results
  let crossChainResults = ''; // Store cross-chain transfer results

  try {
    const env = process.env;

    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    let redactedAppSecret = 'App secret is not set';
    // ensure appSecretObj is declared
    let appSecretObj = 'App secret is not set';
    if (IEXEC_APP_DEVELOPER_SECRET) {
      redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, '*');
      try {
        appSecretObj = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
      } catch (e) {
        console.log('Error parsing app secret JSON:', e);
      }
    }

    const FROM_PRIVATE_KEY =
      env.FROM_PRIVATE_KEY ||
      (typeof appSecretObj === 'object' && appSecretObj?.WalletPk) ||
      undefined;
    const privateKeyFrom = FROM_PRIVATE_KEY;

    const rpcUrlSepolia = 'https://1rpc.io/sepolia';
    const provider = new JsonRpcProvider(rpcUrlSepolia);
    const wallet = new Wallet(privateKeyFrom, provider);
    const erc7984Abi = ["function confidentialTransfer(address to, bytes32 encryptedAmount, bytes calldata inputProof) external"];
    const erc7984address = '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560';
    const erc7984Contract = new Contract(erc7984address, erc7984Abi, wallet);

    // Initialize the FHE instance
    const instance = await createInstance(SepoliaConfig);
    const contractAddress = '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560';
    const userAddress = '0x2191433264B3E4F50439b3822323EC14448B192c';

    console.log('Creating encrypted input buffer...');

    // Create a buffer for values to encrypt and register to the fhevm
    const buffer = instance.createEncryptedInput(
      contractAddress, // Contract address allowed to interact with the ciphertexts
      userAddress      // User address allowed to import ciphertexts
    );

    // Example transfer amount (in wei or token units)
    const transferAmount = BigInt(1000000); // 1 token with 6 decimals

    // Add the transfer amount as encrypted value
    buffer.add64(transferAmount);

    console.log('Encrypting transfer amount...');

    // Encrypt the values and upload ciphertexts using the relayer
    const ciphertexts = await buffer.encrypt();

    const confidentialTransferTx = await erc7984Contract.confidentialTransfer(
      "0x6BbFd1F6dC17322a6e8923cf8072a735A081a975", // recipient address
      ciphertexts.handles[0],
      ciphertexts.inputProof
    );

    console.log('Secret transfer initiated successfully!');
    console.log('Encrypted transfer amount:', ciphertexts);
    console.log('Transfer details:');
    console.log('- Amount:', transferAmount.toString());
    console.log('- Contract:', contractAddress);
    console.log('- User:', userAddress);
    console.log('- Transaction Hash:', confidentialTransferTx.hash);

    // Store secret transfer results for result.txt
    secretTransferResults = `
SECRET TRANSFER RESULTS:
========================
✅ Secret transfer initiated successfully!

Transfer Details:
- Amount: ${transferAmount.toString()} (1 token with 6 decimals)
- Contract: ${contractAddress}
- User: ${userAddress}
- Transaction Hash: ${confidentialTransferTx.hash}

Encrypted Data:
- Handles: ${JSON.stringify(ciphertexts.handles)}
- Input Proof: ${ciphertexts.inputProof}

Status: COMPLETED
========================

`;

    // Add to computed.json
    computedJsonObj['secret-transfer-tx-hash'] = confidentialTransferTx.hash;
    computedJsonObj['secret-transfer-amount'] = transferAmount.toString();
    computedJsonObj['secret-transfer-contract'] = contractAddress;

  } catch (e) {
    console.log('It seems there is an issue with your confidential transfer:', e);

    // Store error results for result.txt
    secretTransferResults = `
SECRET TRANSFER RESULTS:
========================
❌ Secret transfer failed!

Error: ${e.message || e}

Status: FAILED
========================

`;

    // Add error to computed.json
    computedJsonObj['secret-transfer-error'] = String(e.message || e);
  }

  // 1inch Cross-Chain Transfer
  try {
    console.log('Starting 1inch cross-chain transfer...');
    
    const makerPrivateKey = privateKeyFrom;
    const makerAddress = '0xe8F413337d1c3B742fBf1A00269EBeeb0148d00a';
    const nodeUrl = 'https://api.zan.top/arb-one';
    const devPortalApiKey = 'YQHuJSC1ldePR4Tk86FLNfOOOl1BMXmm';

    // Validate environment variables
    if (!makerPrivateKey || !makerAddress || !nodeUrl || !devPortalApiKey) {
        throw new Error("Missing required parameters for 1inch cross-chain transfer.");
    }

    const web3Instance = new Web3(nodeUrl);
    const blockchainProvider = new PrivateKeyProviderConnector(makerPrivateKey, web3Instance);

    const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: devPortalApiKey,
        blockchainProvider
    });

    let srcChainId = NetworkEnum.ARBITRUM;
    let dstChainId = NetworkEnum.COINBASE;
    let srcTokenAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; //USDC
    let dstTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; //USDC

    const approveABI = [{
        "constant": false,
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }];

    const invert = false;

    if (invert) {
        const temp = srcChainId;
        srcChainId = dstChainId;
        dstChainId = temp;

        const tempAddress = srcTokenAddress;
        srcTokenAddress = dstTokenAddress;
        dstTokenAddress = tempAddress;
    }

    // Approve tokens for spending.
    const crossChainProvider = new JsonRpcProvider(nodeUrl);
    const tkn = new Contract(srcTokenAddress, approveABI, new Wallet(makerPrivateKey, crossChainProvider));
    await tkn.approve(
        '0x111111125421ca6dc452d289314280a0f8842a65', // aggregation router v6
        10000000 // unlimited allowance
    );

    const params = {
        srcChainId,
        dstChainId,
        srcTokenAddress,
        dstTokenAddress,
        amount: '1000000',
        enableEstimate: true,
        walletAddress: makerAddress
    };

    const quote = await sdk.getQuote(params);
    const secretsCount = quote.getPreset().secretsCount;

    const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
    const secretHashes = secrets.map(x => HashLock.hashSecret(x));

    const hashLock = secretsCount === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(
            secretHashes.map((secretHash, i) =>
                solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
            )
        );

    console.log("Received Fusion+ quote from 1inch API");

    const quoteResponse = await sdk.placeOrder(quote, {
        walletAddress: makerAddress,
        hashLock,
        secretHashes
    });

    const orderHash = quoteResponse.orderHash;
    console.log(`Order successfully placed: ${orderHash}`);

    crossChainResults = `
CROSS-CHAIN TRANSFER RESULTS:
=============================
✅ 1inch Fusion+ order placed successfully!

Order Details:
- Order Hash: ${orderHash}
- Source Chain: ${srcChainId} (Arbitrum)
- Destination Chain: ${dstChainId} (Coinbase)
- Source Token: ${srcTokenAddress}
- Destination Token: ${dstTokenAddress}
- Amount: 1000000 (1 USDC)
- Maker Address: ${makerAddress}

Status: ORDER_PLACED
=============================

`;

    // Add to computed.json
    computedJsonObj['cross-chain-order-hash'] = orderHash;
    computedJsonObj['cross-chain-src-chain'] = srcChainId;
    computedJsonObj['cross-chain-dst-chain'] = dstChainId;
    computedJsonObj['cross-chain-amount'] = '1000000';

  } catch (e) {
    console.log('Cross-chain transfer failed:', e);

    crossChainResults = `
CROSS-CHAIN TRANSFER RESULTS:
=============================
❌ 1inch Fusion+ order failed!

Error: ${e.message || e}

Status: FAILED
=============================

`;

    computedJsonObj['cross-chain-error'] = String(e.message || e);
  }

  try {
    let messages = [];
    //let protectedName = 'No protected data found'; // Initialize here
    let protectedInvoiceId = 'N/A';
    let protectedAmount = 'N/A';
    let protectedChain = 'N/A';
    let protectedToken = 'N/A';
    let protectedWallet = 'N/A';

    try {
      const deserializer = new IExecDataProtectorDeserializer();
      // The protected data mock created for the purpose of this Hello World journey
      // contains an object with a key "secretText" which is a string
      //protectedName = await deserializer.getValue('email', 'string');
      protectedInvoiceId = await deserializer.getValue('invoiceId', 'string');
      protectedAmount = await deserializer.getValue('amount', 'string');
      protectedChain = await deserializer.getValue('chain', 'string');
      protectedToken = await deserializer.getValue('token', 'string');
      protectedWallet = await deserializer.getValue('wallet', 'string');

      console.log('Found protected data:');
      console.log('- Invoice ID:', protectedInvoiceId);
      console.log('- Amount:', protectedAmount);
      console.log('- Chain:', protectedChain);
      console.log('- Token:', protectedToken);
      console.log('- Wallet:', protectedWallet);

      //messages.push(protectedName);
      messages.push(protectedInvoiceId);
      messages.push(protectedAmount);
      messages.push(protectedChain);
      messages.push(protectedToken);
      messages.push(protectedWallet);

      // Use the protected data in your confidential transfer
      const transferAmount = BigInt(parseFloat(protectedAmount) * 1000000); // Convert to token units (6 decimals)
      const recipientWallet = protectedWallet;
      const tokenContract = '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560'; // Your cUSD contract
      
      console.log('Using protected data for transfer:');
      console.log('- Transfer Amount (BigInt):', transferAmount.toString());
      console.log('- Recipient Wallet:', recipientWallet);
      console.log('- Token Contract:', tokenContract);

    } catch (e) {
      console.log('It seems there is an issue with your protected data:', e);
    }

    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    let redactedAppSecret = 'App secret is not set';
    // ensure appSecretObj is declared
    let appSecretObj = 'App secret is not set';
    if (IEXEC_APP_DEVELOPER_SECRET) {
      redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, '*');
      try {
        appSecretObj = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
      } catch (err) {
        // leave as raw string if not JSON
        appSecretObj = IEXEC_APP_DEVELOPER_SECRET;
      }

      console.log(`Got an app secret (${redactedAppSecret})!`);
    } else {
      console.log(`App secret is not set`);
    }

    // optional: send ERC20 token if env vars are provided
    // Required env vars:
    // RPC_URL, FROM_PRIVATE_KEY, TO_ADDRESS, ERC20_ADDRESS, ERC20_AMOUNT
    try {
      // defaults provided per your request
      const DEFAULTS = {
        RPC_URL: 'https://sepolia-rollup.arbitrum.io/rpc',
        TO_ADDRESS: protectedWallet,
        ERC20_ADDRESS: '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560',
        ERC20_AMOUNT: protectedAmount,
        ERC20_DECIMALS: '6',
      };

      const env = process.env;

      const RPC_URL = env.RPC_URL || DEFAULTS.RPC_URL;
      // prefer private key from app secret object key "WalletPk"
      const FROM_PRIVATE_KEY =
        env.FROM_PRIVATE_KEY ||
        (typeof appSecretObj === 'object' && appSecretObj?.WalletPk) ||
        undefined;

      const TO_ADDRESS = env.TO_ADDRESS || DEFAULTS.TO_ADDRESS;
      const ERC20_ADDRESS = env.ERC20_ADDRESS || DEFAULTS.ERC20_ADDRESS;
      const ERC20_AMOUNT = protectedAmount;
      const ERC20_DECIMALS = env.ERC20_DECIMALS || DEFAULTS.ERC20_DECIMALS;

      if (RPC_URL && FROM_PRIVATE_KEY && TO_ADDRESS && ERC20_ADDRESS && ERC20_AMOUNT) {
        const transferResult = await sendErc20({
          rpcUrl: RPC_URL,
          privateKeyFrom: FROM_PRIVATE_KEY,
          to: protectedWallet,
          tokenAddress: ERC20_ADDRESS,
          amount: protectedAmount,
          decimals: ERC20_DECIMALS ? parseInt(ERC20_DECIMALS, 10) : 18,
        });

        // expose tx hash in computed.json
        computedJsonObj['erc20-tx-hash'] = transferResult.txHash;
      } else {
        console.log('ERC20 transfer env vars not fully provided; skipping token transfer.');
        if (!FROM_PRIVATE_KEY) computedJsonObj['erc20-error'] = 'Missing sender private key';
      }
    } catch (e) {
      console.log('ERC20 transfer failed:', e);
      // continue execution; include error in computed.json
      computedJsonObj['erc20-error'] = String(e.message || e);
    }

    // add result.txt to IEXEC_OUT
    const formattedAppSecret =
      typeof appSecretObj === 'string' ? appSecretObj : JSON.stringify(appSecretObj, null, 2);
    
    // Include secret transfer results, cross-chain results, and protected data in the result.txt content
    const resultContent = `${secretTransferResults}${crossChainResults}

PROTECTED DATA RESULTS:
======================
Invoice ID: ${protectedInvoiceId}
Amount: ${protectedAmount}
Chain: ${protectedChain}
Token: ${protectedToken}
Wallet: ${protectedWallet}
======================
`;
    
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, resultContent);

    // Build the "computed.json" object
    computedJsonObj = {
      ...computedJsonObj,
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      'protected-data': messages.length > 0 ? messages : null,
    };
  } catch (e) {
    // Handle errors
    console.log(e);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      'deterministic-output-path': IEXEC_OUT,
      'error-message': 'Oops something went wrong',
      ...computedJsonObj,
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();
