function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://ethrome2025.vercel.app";

  const manifest = {
    "accountAssociation": {
      "header": "eyJmaWQiOjIxNjM4MywidHlwZSI6ImF1dGgiLCJrZXkiOiIweENhMDU3RDcxRWY1NDE5RDZDNzhlNTI3MTU2NUFDZEMwMzAxZjA0ODAifQ",
      "payload": "eyJkb21haW4iOiJldGhyb21lMjAyNS52ZXJjZWwuYXBwIn0",
      "signature": "JIe7MjJBL6f8Dv3pnadSfWQCO1Q286qZQXlOJA1ixOZKh/43nn8gBXFWPBwKthLfLnf4X8pxLfqzvMN49xHKphw="
    },
    baseBuilder: {
      ownerAddress: "0x1eA091521DC4A2035a586995f9fB7ca7b0F646ad"
    },
    miniapp: {
      version: "1",
      name: "iExec DataProtector Mini App",
      homeUrl: URL,
      iconUrl: `${URL}/vercel.svg`,
      splashBackgroundColor: "#F4F7FC",
      subtitle: "Secure data protection",
      description: "Protect your data with iExec DataProtector. Encrypt, store, and grant access to your data securely on the blockchain.",
      primaryCategory: "social",
      tags: ["iexec", "dataprotector", "privacy", "blockchain"],
      tagline: "Protect data instantly",
      ogTitle: "iExec DataProtector Mini App",
      ogDescription: "Secure and grant access to your encrypted data on-chain.",
      noindex: true // Set to false when ready for production
    }
  };

  return Response.json(manifest);
}
