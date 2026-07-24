import type { NextConfig } from "next";

const cognitoDomain =
  process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "jsvs-auth-893931644314.auth.us-east-1.amazoncognito.com";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://emb6fxuhfb.execute-api.us-east-1.amazonaws.com";

function originFromUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}

const apiOrigin = originFromUrl(apiUrl);
const cognitoOrigin = `https://${cognitoDomain.replace(/^https?:\/\//, "")}`;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' " + cognitoOrigin,
  "img-src 'self' data: blob: https://*.amazonaws.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js requires unsafe-inline/eval in production builds for some runtime chunks;
  // keep script sources tight otherwise.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  [
    "connect-src 'self'",
    apiOrigin,
    cognitoOrigin,
    "https://*.execute-api.us-east-1.amazonaws.com",
    "https://*.s3.us-east-1.amazonaws.com",
    "https://*.s3.amazonaws.com",
    "https://cognito-idp.us-east-1.amazonaws.com"
  ].join(" "),
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nextConfig: NextConfig = {
  transpilePackages: ["@vsn/types"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.jsveteransolutions.com" }],
        destination: "https://jsveteransolutions.com/:path*",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
