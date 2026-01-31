/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel deployment
  output: undefined, // Let Vercel handle output automatically
  
  // Ensure proper environment variable handling
  env: {
    // These will be available at build time
    // Runtime env vars should be set in Vercel dashboard
  },
  
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Optimize images if using next/image
  images: {
    domains: [],
  },
};

export default nextConfig;
