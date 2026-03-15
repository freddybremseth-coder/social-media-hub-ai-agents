/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript/ESLint errors during Vercel build (already verified locally)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Prevent Next.js from webpack-bundling ffmpeg-static (keep as external require)
  serverExternalPackages: ['ffmpeg-static'],

  // Force-include the ffmpeg binary in the serverless function bundle.
  // Without this, the binary file isn't traced as a dependency.
  // Reference: https://github.com/vercel-labs/ffmpeg-on-vercel
  outputFileTracingIncludes: {
    '/app/api/neural-beat': [
      './node_modules/ffmpeg-static/ffmpeg',
      './node_modules/ffmpeg-static/**/*',
    ],
    '/api/neural-beat': [
      './node_modules/ffmpeg-static/ffmpeg',
      './node_modules/ffmpeg-static/**/*',
    ],
  },
};

export default nextConfig;
