import type { NextConfig } from "next";
const backend = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
const config: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/api/me/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};
export default config;
