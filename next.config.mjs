/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "**" }] // allows favicon images from any bookmarked site
  }
};

export default nextConfig;
