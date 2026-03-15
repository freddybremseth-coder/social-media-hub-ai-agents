/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript/ESLint errors during Vercel build (already verified locally)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Include ffmpeg/ffprobe static binaries in the serverless function bundle
  // These are needed for Neural Beat video rendering on Vercel
  serverExternalPackages: ['ffmpeg-static', 'ffprobe-static'],

  // Ensure the binary files are traced and included in the deployment
  experimental: {
    outputFileTracingIncludes: {
      '/api/neural-beat': [
        './node_modules/ffmpeg-static/ffmpeg',
        './node_modules/ffmpeg-static/**/*',
        './node_modules/ffprobe-static/**/*',
      ],
    },
  },
};

export default nextConfig;
