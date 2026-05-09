/**
 * Next.js Configuration
 * 
 * To enable LAN access (e.g., for mobile testing), you can set the ALLOWED_DEV_ORIGINS 
 * environment variable with a comma-separated list of allowed origins.
 * 
 * Recommended: Create a .env.local file (which is git-ignored) and add:
 * ALLOWED_DEV_ORIGINS=localhost,localhost:3000,192.168.x.x,192.168.x.x:3000
 * 
 * Then run:
 * npm run dev -- -H 0.0.0.0
 * 
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || ['localhost:3000']
};

export default nextConfig;
