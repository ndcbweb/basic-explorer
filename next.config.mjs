/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Lets parallel local builds use separate output folders; releases always use .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
