import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Requerido para crear una imagen Docker mínima
};

export default nextConfig;
