import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/node';
import { Wallet, Contract, JsonRpcProvider, parseUnits } from 'ethers';
import 'dotenv/config';

async function confidentialTransfer() {
  try {
    const privateKeyFrom = process.env.PRIVATE_KEY_FROM;
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
      userAddress,
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

    return {
      success: true,
      ciphertexts,
      amount: transferAmount.toString(),
      contractAddress,
      userAddress
    };

  } catch (error) {
    console.error('Error during secret transfer:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the confidential transfer
confidentialTransfer()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Confidential transfer completed successfully');
    } else {
      console.log('\n❌ Confidential transfer failed:', result.error);
    }
  })
  .catch(console.error);