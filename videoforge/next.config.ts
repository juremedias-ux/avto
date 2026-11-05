import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

// Supabase origin is needed for signed storage URLs (video playback, image upload).
const supabaseOrigin = originOf(process.env.SUPABASE_URL);
const supabase = supabaseOrigin ? ` ${supabaseOrigin}` : "";

/**
 * Content Security Policy. 'unsafe-inline' for scripts is required by the inline
 * bootstrap scripts Next.js emits without a nonce. No third-party scripts are loaded.
 * form-action includes the external hosts that server actions redirect to
 * (Stripe Checkout / Billing Portal, Supabase Auth → Google OAuth).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabase} https://lh3.googleusercontent.com`,
  `media-src 'self' blob:${supabase}`,
  "font-src 'self'",
  `connect-src 'self'${supabase}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self'${supabase} https://checkout.stripe.com https://billing.stripe.com https://accounts.google.com`,
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()" },
];

const privatePaths = ["/dashboard", "/create", "/library", "/billing", "/settings", "/admin", "/api"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This app lives in a subdirectory of a repository that has its own lockfile.
  turbopack: { root: __dirname },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...privatePaths.flatMap((p) => [
        {
          source: p,
          headers: [
            { key: "Cache-Control", value: "private, no-store, max-age=0" },
            { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ],
        },
        {
          source: `${p}/:path*`,
          headers: [
            { key: "Cache-Control", value: "private, no-store, max-age=0" },
            { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ],
        },
      ]),
    ];
  },
};

export default nextConfig;
