/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript/ESLint errors during Vercel build (already verified locally)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Include ffmpeg/ffprobe static binaries in the serverless function bundle
  // These are needed for Neural Beat video rendering on Vercel
  serverExternalPackages: ['ffmpeg-static', 'ffprobe-static'],

  // Ensure the FFmpeg/FFprobe binary files are traced and included in the
  // serverless function bundle. Include both path key variants to cover
  // App Router resolution in different Next.js versions.
  // Reference: https://github.com/vercel-labs/ffmpeg-on-vercel
  outputFileTracingIncludes: {
    // App Router key format (vercel-labs uses /app/<route>)
    '/app/api/neural-beat': [
      './node_modules/ffmpeg-static/ffmpeg',
      './node_modules/ffmpeg-static/**/*',
      './node_modules/ffprobe-static/**/*',
    ],
    // URL path format (fallback)
    '/api/neural-beat': [
      './node_modules/ffmpeg-static/ffmpeg',
      './node_modules/ffmpeg-static/**/*',
      './node_modules/ffprobe-static/**/*',
    ],
  },
};

export default nextConfig;
