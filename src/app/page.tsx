"use client";

import { useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import {
  IExecDataProtector,
  IExecDataProtectorCore,
  ProtectedData,
  GrantedAccess,
  type ProcessProtectedDataResponse,
  getWeb3Provider,
  Web3SignerProvider
} from "@iexec/dataprotector";
import { sdk } from '@farcaster/miniapp-sdk';
import Link from 'next/link';
import Image from 'next/image'

//import WelcomeBlock from "@/components/WelcomeBlock";
import wagmiNetworks, { explorerSlugs } from "@/config/wagmiNetworks";

// External Link Icon Component
const ExternalLinkIcon = () => (
  <svg
    className="inline-block w-3 h-3 ml-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

// Replace the interfaces at the top with proper types:

interface JsonExtractedFile {
  content: Record<string, unknown>;
  type: 'json';
  rawContent: string;
}

interface TextExtractedFile {
  content: string;
  type: 'text';
  rawContent: string;
}

interface ErrorExtractedFile {
  content: string;
  type: 'error';
  rawContent: string;
}

type ExtractedFile = JsonExtractedFile | TextExtractedFile | ErrorExtractedFile;

interface ExtractedFiles {
  [filename: string]: ExtractedFile;
}

interface TaskResult {
  result: ArrayBuffer | unknown;
  decodedResult?: string | Record<string, unknown>; // More specific than 'object'
  rawText?: string;
  resultType?: 'zip' | 'json' | 'text' | 'binary';
  hexPreview?: string;
  [key: string]: unknown;
}

export default function Home() {
  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();
  const { isConnected, connector, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);
  const [dataToProtect, setDataToProtect] = useState({
    name: "invoice",
    invoiceId: "",
    amount: "",
    chain: "",
    token: "",
  });
  const [protectedData, setProtectedData] = useState<ProtectedData>();
  const [isLoading, setIsLoading] = useState(false);

  // iExec Web3Mail app addresses by chain
  const web3MailAddresses = {
    134: "0x781482c39cce25546583eac4957fb7bf04c277d2", // iExec Sidechain (Bellecour)
    42161: "0xd5054a18565c4a9e5c1aa3ceb53258bd59d4c78c", // Arbitrum One
  } as const;

  // Grant Access form data
  const [grantAccessData, setGrantAccessData] = useState({
    protectedDataAddress: "",
    authorizedApp: "0xF998887E7AfaB5c007b00BE486b7F5230699eE53",
    authorizedUser: "0xe8F413337d1c3B742fBf1A00269EBeeb0148d00a",
    pricePerAccess: 0,
    numberOfAccess: 100,
  });
  const [grantedAccess, setGrantedAccess] = useState<GrantedAccess>();
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  // Execute iApp state
  const [executeResult, setExecuteResult] = useState<ProcessProtectedDataResponse>();
  const [isExecuting, setIsExecuting] = useState(false);

  // Remove the eslint-disable comments and fix the state types:
  const [taskResult, setTaskResult] = useState<TaskResult | undefined>();
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFiles | undefined>();

  const networks = Object.values(wagmiNetworks);

  const login = () => {
    open({ view: "Connect" });
  };

  const logout = async () => {
    try {
      await disconnectAsync();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const handleChainChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedChainId = parseInt(event.target.value);
    if (selectedChainId && selectedChainId !== chainId && switchChain) {
      try {
        await switchChain({ chainId: selectedChainId });
      } catch (error) {
        console.error("Failed to switch chain:", error);
      }
    }
  };

  // Get Web3Mail address for current chain
  const getCurrentWeb3MailAddress = () => {
    return web3MailAddresses[chainId as keyof typeof web3MailAddresses] || "";
  };

  // Get explorer URL for current chain using iExec explorer
  const getExplorerUrl = (
    address: string | undefined,
    type: "address" | "dataset" | "apps" = "address"
  ) => {
    const explorerSlug = explorerSlugs[chainId];
    if (!explorerSlug) return null;

    if (!address) return `https://explorer.iex.ec/${explorerSlug}/${type}`;
    return `https://explorer.iex.ec/${explorerSlug}/${type}/${address}`;
  };

  // Signal to Base app that the mini app is ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    const initializeDataProtector = async () => {
      if (isConnected && connector) {
        try {
          const provider = (await connector.getProvider()) as import("ethers").Eip1193Provider;
          const dataProtector = new IExecDataProtector(provider, {
            allowExperimentalNetworks: false,
          });
          setDataProtectorCore(dataProtector.core);
        } catch (error) {
          console.error("Failed to initialize data protector:", error);
        }
      }
    };

    initializeDataProtector();
  }, [isConnected, connector]);

  const grantDataAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (dataProtectorCore) {
      setIsGrantingAccess(true);
      try {
        const result = await dataProtectorCore.grantAccess({
          protectedData: grantAccessData.protectedDataAddress,
          authorizedApp: grantAccessData.authorizedApp,
          authorizedUser: grantAccessData.authorizedUser,
          pricePerAccess: grantAccessData.pricePerAccess,
          numberOfAccess: grantAccessData.numberOfAccess,
          onStatusUpdate: ({
            title,
            isDone,
          }: {
            title: string;
            isDone: boolean;
          }) => {
            console.log(`Grant Access Status: ${title}, Done: ${isDone}`);
          },
        });
        console.log("Granted Access:", result);
        setGrantedAccess(result);
      } catch (error) {
        console.error("Error granting access:", error);
      } finally {
        setIsGrantingAccess(false);
      }
    }
  };

  const protectData = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (dataProtectorCore) {
      setIsLoading(true);
      try {
        const protectedData = await dataProtectorCore.protectData({
          name: dataToProtect.name,
          data: {
            invoiceId: dataToProtect.invoiceId,
            amount: dataToProtect.amount,
            chain: dataToProtect.chain,
            token: dataToProtect.token,
            wallet: address || "",
          },
        });
        console.log("Protected Data:", protectedData);
        setProtectedData(protectedData);

        // Automatically grant access after protection
        console.log("Automatically granting access...");
        const accessResult = await dataProtectorCore.grantAccess({
          protectedData: protectedData.address,
          authorizedApp: grantAccessData.authorizedApp,
          authorizedUser: grantAccessData.authorizedUser,
          pricePerAccess: grantAccessData.pricePerAccess,
          numberOfAccess: grantAccessData.numberOfAccess,
          onStatusUpdate: ({
            title,
            isDone,
          }: {
            title: string;
            isDone: boolean;
          }) => {
            console.log(`Grant Access Status: ${title}, Done: ${isDone}`);
          },
        });
        console.log("Granted Access:", accessResult);
        setGrantedAccess(accessResult);

      } catch (error) {
        console.error("Error protecting data or granting access:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const executeIApp = async () => {
    if (dataProtectorCore && protectedData?.address) {
      setIsExecuting(true);
      try {
          const result = await dataProtectorCore.processProtectedData({
          protectedData: protectedData.address,
          app: '0xF998887E7AfaB5c007b00BE486b7F5230699eE53',
          workerpoolMaxPrice: 1000000000,
          path: 'data/result.txt', 
          onStatusUpdate: ({ title, isDone }) => {
            console.log(title, isDone);
          }
        });
        console.log("Execute iApp Result:", result);
        setExecuteResult(result);
      } catch (error) {
        console.error("Error executing iApp:", error);
      } finally {
        setIsExecuting(false);
      }
    }
  }

        /*
        if (!result.taskId) {
          throw new Error("No taskId returned from processProtectedData");
        }

        const completedTaskResult = await dataProtectorCore.getResultFromCompletedTask({
          taskId: result.taskId,
        });
        console.log("Task Result:", completedTaskResult);

        // Decode the ArrayBuffer result
        if (completedTaskResult.result instanceof ArrayBuffer) {
          try {
            // Try to decode as UTF-8 text
            const decoder = new TextDecoder('utf-8');
            const decodedText = decoder.decode(completedTaskResult.result);
            console.log("Decoded result as text:", decodedText);

            // Check if it's a ZIP file (starts with "PK")
            if (decodedText.startsWith('PK')) {
              console.log("Detected ZIP file");

              // Extract ZIP contents using a simple approach
              try {
                await extractZipContents(completedTaskResult.result);

                setTaskResult({
                  ...completedTaskResult,
                  decodedResult: 'ZIP file detected - contents extracted below',
                  rawText: decodedText,
                  resultType: 'zip'
                });
              } catch (zipError) {
                console.error("Failed to extract ZIP:", zipError);
                setTaskResult({
                  ...completedTaskResult,
                  decodedResult: decodedText,
                  rawText: decodedText,
                  resultType: 'text'
                });
              }
            } else {
              // Try to parse as JSON
              try {
                const jsonResult = JSON.parse(decodedText);
                console.log("Parsed JSON result:", jsonResult);
                setTaskResult({
                  ...completedTaskResult,
                  decodedResult: jsonResult,
                  rawText: decodedText,
                  resultType: 'json'
                });
              } catch (jsonError) {
                // If not JSON, treat as plain text
                console.log("Result is plain text, not JSON", jsonError);
                setTaskResult({
                  ...completedTaskResult,
                  decodedResult: decodedText,
                  rawText: decodedText,
                  resultType: 'text'
                });
              }
            }
          } catch (decodeError) {
            console.error("Failed to decode ArrayBuffer:", decodeError);
            // If text decoding fails, show as binary data
            const uint8Array = new Uint8Array(completedTaskResult.result);
            const hexString = Array.from(uint8Array)
              .map(byte => byte.toString(16).padStart(2, '0'))
              .join(' ');

            setTaskResult({
              ...completedTaskResult,
              decodedResult: `Binary data (${completedTaskResult.result.byteLength} bytes)`,
              hexPreview: hexString.substring(0, 200) + (hexString.length > 200 ? '...' : ''),
              resultType: 'binary'
            });
          }
        } else {
          setTaskResult(completedTaskResult);
        }

      } catch (error) {
        console.error("Error executing iApp:", error);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  // Function to extract ZIP contents
  const extractZipContents = async (zipBuffer: ArrayBuffer) => {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const zipContents = await zip.loadAsync(zipBuffer);
      const files: ExtractedFiles = {}; // Replace 'any' with 'ExtractedFiles'

      // Extract each file
      for (const [filename, file] of Object.entries(zipContents.files)) {
        if (!file.dir) {
          try {
            const content = await file.async('text');
            console.log(`Extracted ${filename}:`, content);

            // Try to parse JSON files
            if (filename.endsWith('.json')) {
              try {
                files[filename] = {
                  content: JSON.parse(content),
                  type: 'json',
                  rawContent: content
                };
              } catch {
                files[filename] = {
                  content: content,
                  type: 'text',
                  rawContent: content
                };
              }
            } else {
              files[filename] = {
                content: content,
                type: 'text',
                rawContent: content
              };
            }
          } catch (error) {
            console.error(`Error extracting ${filename}:`, error);
            files[filename] = {
              content: `Error extracting file: ${error}`,
              type: 'error',
              rawContent: ''
            };
          }
        }
      }

      setExtractedFiles(files);
      console.log("All extracted files:", files);
    } catch (error) {
      console.error("Error extracting ZIP:", error);
      throw error;
    }
  };*/

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-3 sm:p-5">
        <nav className="bg-white shadow-lg rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shadow-md">
                <Image 
                  src="/RomePay.png" 
                  alt="RomePay Logo" 
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </Link>
            
            {/* Centered RomePay text */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RomePay
              </h1>
            </div>
            
            {/* Connect/Disconnect Button */}
            <div className="flex items-center">
              {!isConnected ? (
                <button onClick={login} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md">
                  Connect Wallet
                </button>
              ) : (
                <button onClick={logout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-all duration-200 border border-gray-200">
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </nav>

        <section className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-8 md:p-10">
            {isConnected ? (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Secure Invoice Protection
                  </h2>
                </div>

                <form onSubmit={protectData} className="mb-8">
                  <input type="hidden" name="name" value={dataToProtect.name} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice ID
                      </label>
                      <input
                        onChange={(e) =>
                          setDataToProtect((prev) => ({ ...prev, invoiceId: e.target.value }))
                        }
                        type="text"
                        id="invoice_id"
                        placeholder="INV-2024-001"
                        value={dataToProtect.invoiceId}
                        maxLength={200}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        onChange={(e) =>
                          setDataToProtect((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        type="text"
                        id="amount"
                        placeholder="100.50"
                        value={dataToProtect.amount}
                        maxLength={200}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="chain" className="block text-sm font-medium text-gray-700 mb-2">
                        Blockchain
                      </label>
                      <input
                        onChange={(e) =>
                          setDataToProtect((prev) => ({ ...prev, chain: e.target.value }))
                        }
                        type="text"
                        id="chain"
                        placeholder="Ethereum"
                        value={dataToProtect.chain}
                        maxLength={200}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                        Token
                      </label>
                      <input
                        onChange={(e) =>
                          setDataToProtect((prev) => ({ ...prev, token: e.target.value }))
                        }
                        type="text"
                        id="token"
                        placeholder="USDC"
                        value={dataToProtect.token}
                        maxLength={200}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    disabled={
                      !dataToProtect.invoiceId || !dataToProtect.amount || !dataToProtect.chain || !dataToProtect.token || isLoading
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium px-6 py-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none"
                    type="submit"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Protecting Data...
                      </span>
                    ) : (
                      "🔒 Protect My Invoice Data"
                    )}
                  </button>
                </form>

                {protectedData && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mt-6">
                    <h3 className="text-green-800 mb-4 text-lg font-semibold flex items-center gap-2">
                      ✅ Data Protected Successfully!
                    </h3>
                    <div className="text-green-800 space-y-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <strong className="text-green-900">Name:</strong>
                          <p className="text-green-700">{protectedData.name}</p>
                        </div>
                        <div>
                          <strong className="text-green-900">Address:</strong>
                          <p className="break-all text-green-700 font-mono text-xs">{protectedData.address}</p>
                          {getExplorerUrl(protectedData.address, "dataset") && (
                            <a
                              href={getExplorerUrl(protectedData.address, "dataset")!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors mt-1 text-xs"
                            >
                              View on Explorer <ExternalLinkIcon />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {grantedAccess && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
                    <h3 className="text-blue-800 mb-4 text-lg font-semibold flex items-center gap-2">
                      🎯 Access Granted Automatically!
                    </h3>
                    <div className="text-blue-800 space-y-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <strong className="text-blue-900">Volume:</strong>
                          <p className="text-blue-700">{grantedAccess.volume}</p>
                        </div>
                        <div>
                          <strong className="text-blue-900">Price:</strong>
                          <p className="text-blue-700">{grantedAccess.datasetprice} nRLC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Execute iApp Section */}
                <div className="mt-4 pt-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                      Execute iApp Processing
                    </h2>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={executeIApp}
                      disabled={!dataProtectorCore || !protectedData?.address || isExecuting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none mb-4"
                    >
                      {isExecuting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Executing iApp...
                        </span>
                      ) : (
                        "⚡ Execute iApp"
                      )}
                    </button>
                    
                    {!protectedData?.address && (
                      <p className="text-sm text-gray-500 text-center bg-gray-50 px-4 py-2 rounded-lg border">
                        📋 Please protect your data first to enable iApp execution
                      </p>
                    )}
                  </div>

                  {executeResult && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mt-6">
                      <h3 className="text-emerald-800 mb-4 text-lg font-semibold flex items-center gap-2">
                        🎉 iApp Executed Successfully!
                      </h3>
                      <div className="text-emerald-800 space-y-3 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <strong className="text-emerald-900">Transaction:</strong>
                            <p className="break-all text-emerald-700 font-mono text-xs">{executeResult.txHash}</p>
                          </div>
                          <div>
                            <strong className="text-emerald-900">Deal ID:</strong>
                            <p className="break-all text-emerald-700 font-mono text-xs">{executeResult.dealId}</p>
                          </div>
                          <div>
                            <strong className="text-emerald-900">Task ID:</strong>
                            <p className="break-all text-emerald-700 font-mono text-xs">{executeResult.taskId}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-800">
                    Welcome to RomePay
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Secure your invoice data with advanced cryptographic protection. Connect your wallet to get started with our decentralized data protection platform.
                  </p>
                  <button onClick={login} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Connect Wallet to Begin
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}