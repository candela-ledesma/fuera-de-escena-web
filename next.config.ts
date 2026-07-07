import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless", "ws"],
  experimental: {
    serverActions: {
      // Hasta 2 imágenes de 5MB cada una (ver MAX_IMAGE_SIZE_BYTES /
      // MAX_REVIEW_IMAGES en features/reviews/schema.ts), más margen para
      // el resto del formulario y el overhead del multipart/form-data.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
