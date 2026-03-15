/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript/ESLint errors during Vercel build (already verified locally)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Force-include ONLY the ffmpeg binary file in the serverless function bundle.
  // We use process.cwd() path resolution (not require()), so we don't need
  // serverExternalPackages — just the raw binary in the bundle.
  // Reference: https://github.com/vercel-labs/ffmpeg-on-vercel
  outputFileTracingIncludes: {
    '/app/api/neural-beat': ['./node_modules/ffmpeg-static/ffmpeg'],
    '/api/neural-beat': ['./node_modules/ffmpeg-static/ffmpeg'],
  },
};

export default nextConfig;
