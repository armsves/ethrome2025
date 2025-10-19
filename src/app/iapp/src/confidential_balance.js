import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/node';
import { Wallet, Contract, JsonRpcProvider, parseUnits } from 'ethers';
import 'dotenv/config';

async function confidentialBalance() {
  try {
    const privateKeyFrom = process.env.PRIVATE_KEY_FROM;
    const rpcUrlSepolia = 'https://1rpc.io/sepolia';
    const provider = new JsonRpcProvider(rpcUrlSepolia);
    const wallet = new Wallet(privateKeyFrom, provider);
    const erc7984Abi = [
      "function confidentialTransfer(address to, bytes32 encryptedAmount, bytes calldata inputProof) external",
      "function confidentialBalanceOf(address account) external view returns (bytes32)"
    ];
    
    const erc7984address = '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560';
    const erc7984Contract = new Contract(erc7984address, erc7984Abi, wallet);

    // Initialize the FHE instance
    const instance = await createInstance(SepoliaConfig);
    const contractAddress = '0x5a3F7a5eAa4e6910e3835Bc900173e4BcA37e560';
    const userAddress = '0x2191433264B3E4F50439b3822323EC14448B192c';

    console.log('Getting the encrypted balance...');

    const encryptedBalance = await erc7984Contract.confidentialBalanceOf(userAddress);
    console.log('Encrypted balance retrieved:', encryptedBalance);

    // Generate keypair for decryption
    const keypair = instance.generateKeypair();
    
    // Prepare handle-contract pairs
    const handleContractPairs = [
      {
        handle: encryptedBalance,
        contractAddress: contractAddress,
      },
    ];
    
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10"; // String for consistency
    const contractAddresses = [contractAddress];

    // Create EIP712 signature
    const eip712 = instance.createEIP712(
      keypair.publicKey, 
      contractAddresses, 
      startTimeStamp, 
      durationDays
    );

    console.log('Signing decryption request...');
    
    const signature = await wallet.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message,
    );

    console.log('Decrypting balance...');

    // Decrypt the balance
    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      wallet.address,
      startTimeStamp,
      durationDays,
    );

    const decryptedBalance = result[encryptedBalance];
    console.log('Decrypted balance:', decryptedBalance.toString());
    console.log('Decrypted balance (formatted):', (Number(decryptedBalance) / 1000000).toFixed(6), 'tokens');

    return {
      success: true,
      encryptedBalance,
      decryptedBalance: decryptedBalance.toString(),
      formattedBalance: (Number(decryptedBalance) / 1000000).toFixed(6),
      contractAddress,
      userAddress
    };

  } catch (error) {
    console.error('Error during balance decryption:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the confidential balance check
confidentialBalance()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Balance decryption completed successfully');
      console.log('Raw balance:', result.decryptedBalance);
      console.log('Formatted balance:', result.formattedBalance, 'tokens');
    } else {
      console.log('\n❌ Balance decryption failed:', result.error);
    }
  })
  .catch(console.error);