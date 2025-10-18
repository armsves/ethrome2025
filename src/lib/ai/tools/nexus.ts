import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getTokens } from "@civic/auth-web3/nextjs";
import { experimental_createMCPClient as createMCPClient } from "ai";

export const getNexusTools = async () => {
  console.log('[Nexus] Getting access token...');
  const tokens = await getTokens();
  console.log('[Nexus] Tokens result:', tokens ? 'found' : 'null');

  const { accessToken } = tokens ?? {};

  if (!accessToken) {
    // Return empty tools if no access token (Nexus is optional)
    console.warn('[Nexus] No access token available - Nexus tools will not be available');
    return {};
  }

  console.log('[Nexus] Access token found, length:', accessToken.length);

  try {
    console.log('[Nexus] Creating MCP transport');
    const transport = new StreamableHTTPClientTransport(
      new URL('https://nexus.civic.com/hub/mcp'), {
        requestInit: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    console.log('[Nexus] Creating MCP client');
    const mcpClient = await createMCPClient({ transport });

    console.log('[Nexus] Getting tools from MCP client');
    const tools = mcpClient.tools();
    console.log('[Nexus] Tools retrieved:', Object.keys(tools).length);

    return tools;
  } catch (error) {
    console.error('[Nexus] Failed to load Nexus tools:', error);
    console.error('[Nexus] Error details:', error instanceof Error ? error.message : error);
    return {};
  }
}
