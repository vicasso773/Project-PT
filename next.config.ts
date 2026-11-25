import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the database drivers as normal Node packages (not bundled).
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
