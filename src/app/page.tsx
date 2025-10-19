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
    authorizedApp: "0x33C52720C54d47377AB8DC9237dD7916D5cE659A",
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
    <div className="max-w-6xl mx-auto p-3 sm:p-5">
      <nav className="bg-[#F4F7FC] rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="font-mono text-lg sm:text-xl font-bold text-gray-800 truncate">
            RomePay
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Chain selector 
          {isConnected && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="chain-selector"
                className="text-sm font-medium text-gray-700 shrink-0"
              >
                Chain:
              </label>
              <select
                id="chain-selector"
                value={chainId}
                onChange={handleChainChange}
                className="chain-selector flex-1 sm:flex-initial"
              >
                {networks?.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          */}
          {!isConnected ? (
            <button onClick={login} className="primary w-full sm:w-auto">
              Connect my wallet
            </button>
          ) : (
            <button onClick={logout} className="secondary w-full sm:w-auto">
              Disconnect
            </button>
          )}
        </div>
      </nav>



      <section className="p-4 sm:p-6 md:p-8 bg-[#F4F7FC] rounded-xl overflow-hidden">
        {isConnected ? (
          <div>
            <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-semibold text-gray-800">
              Invoice Data
            </h2>
            <form onSubmit={protectData} className="mb-6 sm:mb-8">
              {/* Hidden field for name */}
              <input type="hidden" name="name" value={dataToProtect.name} />
              
              <div className="mb-5">
                <input
                  onChange={(e) =>
                    setDataToProtect((prev) => ({ ...prev, invoiceId: e.target.value }))
                  }
                  type="text"
                  id="invoice_id"
                  placeholder="Invoice ID"
                  value={dataToProtect.invoiceId}
                  maxLength={200}
                  className="mb-2"
                />
                <input
                  onChange={(e) =>
                    setDataToProtect((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  type="text"
                  id="amount"
                  placeholder="Amount"
                  value={dataToProtect.amount}
                  maxLength={200}
                  className="mb-2"
                />
                <input
                  onChange={(e) =>
                    setDataToProtect((prev) => ({ ...prev, chain: e.target.value }))
                  }
                  type="text"
                  id="chain"
                  placeholder="Chain"
                  value={dataToProtect.chain}
                  maxLength={200}
                  className="mb-2"
                />
                <input
                  onChange={(e) =>
                    setDataToProtect((prev) => ({ ...prev, token: e.target.value }))
                  }
                  type="text"
                  id="token"
                  placeholder="Token"
                  value={dataToProtect.token}
                  maxLength={200}
                />
              </div>
              <button
                disabled={
                  !dataToProtect.invoiceId || !dataToProtect.amount || !dataToProtect.chain || !dataToProtect.token || isLoading
                }
                className="primary"
                type="submit"
              >
                {isLoading ? "Protecting data..." : "Protect my data"}
              </button>
            </form>

            {protectedData && (
              <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
                <h3 className="text-blue-800 mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
                  ✅ Data protected successfully!
                </h3>
                <div className="text-blue-800 space-y-2 text-xs sm:text-sm">
                  <p>
                    <strong>Name:</strong> {protectedData.name}
                  </p>
                  <p className="break-all">
                    <strong>Address:</strong> {protectedData.address}
                    {getExplorerUrl(protectedData.address, "dataset") && (
                      <a
                        href={getExplorerUrl(protectedData.address, "dataset")!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Protected Data <ExternalLinkIcon />
                      </a>
                    )}
                  </p>
                  <p className="break-all">
                    <strong>Owner:</strong> {protectedData.owner}
                    {getExplorerUrl(protectedData.owner, "address") && (
                      <a
                        href={getExplorerUrl(protectedData.owner, "address")!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Address
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            )}

            {grantedAccess && (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
                <h3 className="text-green-800 mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
                  ✅ Access granted automatically!
                </h3>
                <div className="text-green-800 space-y-2 text-xs sm:text-sm">
                  <p className="break-all">
                    <strong>Protected Data:</strong> {grantedAccess.dataset}
                    {getExplorerUrl(grantedAccess.dataset, "dataset") && (
                      <a
                        href={
                          getExplorerUrl(grantedAccess.dataset, "dataset")!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                      >
                        View Protected Data
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </p>
                  <p>
                    <strong>Protected Data Price:</strong>{" "}
                    {grantedAccess.datasetprice} nRLC
                  </p>
                  <p>
                    <strong>Volume:</strong> {grantedAccess.volume}
                  </p>
                  <p className="break-all">
                    <strong>Authorized User:</strong> {grantedAccess.requesterrestrict}
                  </p>
                </div>
              </div>
            )}

            {/* Execute iApp Section */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-semibold text-gray-800">
                Execute iApp
              </h2>
              <div className="mb-6">
                <button
                  onClick={executeIApp}
                  disabled={!dataProtectorCore || !protectedData?.address || isExecuting}
                  className="primary"
                >
                  {isExecuting ? "Executing iApp..." : "Execute iApp"}
                </button>
                {!protectedData?.address && (
                  <p className="text-sm text-gray-600 mt-2">
                    Please protect your data first to enable iApp execution
                  </p>
                )}
              </div>

              {executeResult && (
                <div className="bg-green-100 border border-green-300 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
                  <h3 className="text-green-800 mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
                    ✅ iApp executed successfully!
                  </h3>
                  <div className="text-green-800 space-y-2 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <strong>Transaction Hash:</strong>
                        <p className="break-all text-green-700">{executeResult.txHash}</p>
                      </div>
                      <div>
                        <strong>Deal ID:</strong>
                        <p className="break-all text-green-700">{executeResult.dealId}</p>
                      </div>
                      <div>
                        <strong>Task ID:</strong>
                        <p className="break-all text-green-700">{executeResult.taskId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {taskResult && (
                <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
                  <h3 className="text-blue-800 mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
                    📋 Task Result
                  </h3>
                  <div className="text-blue-800 space-y-3 text-xs sm:text-sm">

                    {taskResult.resultType === 'zip' && (
                      <div>
                        <strong>ZIP File Contents:</strong>
                        <p className="text-blue-700 mb-3">The result contains a ZIP file with the following files:</p>

                        {extractedFiles && Object.entries(extractedFiles).map(([filename, fileData]: [string, ExtractedFile]) => (
                          <div key={filename} className="mb-4 bg-blue-50 p-3 rounded">
                            <h4 className="font-semibold text-blue-900 mb-2">📄 {filename}</h4>

                            {fileData.type === 'json' && (
                              <div>
                                <p className="text-blue-700 mb-2">JSON Content:</p>
                                <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-64 text-blue-900">
                                  {JSON.stringify(fileData.content, null, 2)}
                                </pre>
                              </div>
                            )}

                            {fileData.type === 'text' && (
                              <div>
                                <p className="text-blue-700 mb-2">Text Content:</p>
                                <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-64 text-blue-900 whitespace-pre-wrap">
                                  {fileData.content} {/* Now TypeScript knows this is always a string */}
                                </pre>
                              </div>
                            )}

                            {fileData.type === 'error' && (
                              <div>
                                <p className="text-red-700 mb-2">Error:</p>
                                <pre className="bg-red-50 p-2 rounded text-xs text-red-900">
                                  {fileData.content} {/* Now TypeScript knows this is always a string */}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {taskResult.resultType === 'json' && (
                      <div>
                        <strong>Processed Data (JSON):</strong>
                        <pre className="bg-blue-50 p-3 rounded text-xs overflow-auto mt-2 text-blue-900 max-h-96">
                          {taskResult.decodedResult
                            ? JSON.stringify(taskResult.decodedResult, null, 2)
                            : 'No data available'
                          }
                        </pre>
                      </div>
                    )}

                    {taskResult.resultType === 'text' && (
                      <div>
                        <strong>Processed Data (Text):</strong>
                        <pre className="bg-blue-50 p-3 rounded text-xs overflow-auto mt-2 text-blue-900 max-h-96 whitespace-pre-wrap">
                          {typeof taskResult.decodedResult === 'string'
                            ? taskResult.decodedResult
                            : JSON.stringify(taskResult.decodedResult || 'No data available', null, 2)
                          }
                        </pre>
                      </div>
                    )}

                    {taskResult.resultType === 'binary' && (
                      <div>
                        <strong>Binary Data:</strong>
                        <p className="text-blue-700 mb-2">
                          {typeof taskResult.decodedResult === 'string'
                            ? taskResult.decodedResult
                            : 'Binary data detected'
                          }
                        </p>
                        <details className="bg-blue-50 p-3 rounded">
                          <summary className="cursor-pointer text-blue-900 font-medium">View Hex Data (first 100 bytes)</summary>
                          <pre className="text-xs mt-2 text-blue-800 overflow-auto">
                            {taskResult.hexPreview || 'No hex preview available'}
                          </pre>
                        </details>
                      </div>
                    )}

                    <div>
                      <strong>Raw Result Info:</strong>
                      <div className="bg-blue-50 p-3 rounded text-xs mt-2 text-blue-900">
                        <p>Type: {taskResult.result instanceof ArrayBuffer ? 'ArrayBuffer' : typeof taskResult.result}</p>
                        {taskResult.result instanceof ArrayBuffer && (
                          <p>Size: {taskResult.result.byteLength} bytes</p>
                        )}
                        {taskResult.resultType === 'zip' && (
                          <p>Format: ZIP Archive containing {extractedFiles ? Object.keys(extractedFiles).length : 0} files</p>
                        )}
                      </div>
                    </div>

                    <details className="bg-blue-50 rounded">
                      <summary className="cursor-pointer p-3 text-blue-900 font-medium">View Complete Task Result</summary>
                      <pre className="p-3 text-xs overflow-auto text-blue-800 max-h-64">
                        {JSON.stringify({
                          ...taskResult,
                          result: taskResult.result instanceof ArrayBuffer
                            ? `[ArrayBuffer ${taskResult.result.byteLength} bytes]`
                            : taskResult.result
                        }, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <h2 className="mb-4 text-xl text-gray-600">
              Connect your wallet to get started
            </h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to use data protection features.
            </p>
            <button onClick={login} className="primary">
              Connect my wallet
            </button>
          </div>
        )}
      </section>
    </div>
  );
}