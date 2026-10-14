import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Keep visited pages in the browser so moving between dashboard/admin
    // sections is instant (Next 15+ default is 0s). router.refresh() and
    // revalidatePath after a save still fetch fresh data.
    staleTimes: {
      dynamic: 60,
    },
  },
  cacheComponents: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
