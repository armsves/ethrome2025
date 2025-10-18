function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;

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
      homeUrl: URL || "https://your-domain.com",
      iconUrl: `${URL}/icon.png`,
      splashImageUrl: `${URL}/splash.png`,
      splashBackgroundColor: "#F4F7FC",
      webhookUrl: `${URL}/api/webhook`,
      subtitle: "Secure data protection on-chain",
      description: "Protect your data with iExec DataProtector. Encrypt, store, and grant access to your data securely on the blockchain.",
      screenshotUrls: [
        `${URL}/screenshot1.png`,
        `${URL}/screenshot2.png`,
        `${URL}/screenshot3.png`
      ],
      primaryCategory: "social",
      tags: ["iexec", "dataprotector", "privacy", "blockchain"],
      heroImageUrl: `${URL}/hero.png`,
      tagline: "Protect data instantly",
      ogTitle: "iExec DataProtector Mini App",
      ogDescription: "Secure and grant access to your encrypted data on-chain.",
      ogImageUrl: `${URL}/og-image.png`,
      noindex: true // Set to false when ready for production
    }
  };

  return Response.json(manifest);
}
