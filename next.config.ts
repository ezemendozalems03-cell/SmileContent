import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El default (1 MB) no alcanza para subir un brandbook PDF a la IA.
      // La validación de la app limita el archivo a 10 MB.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
