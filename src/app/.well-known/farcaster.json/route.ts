function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;

  const manifest = {
    accountAssociation: {
      // These will be generated in step 5 using Base Build Account association tool
      header: "",
      payload: "",
      signature: ""
    },
    baseBuilder: {
      allowedAddresses: [""] // Add your Base Account address here
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
