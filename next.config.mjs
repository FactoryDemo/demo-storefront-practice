/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    // The profiler loads a native binary at runtime, so it must stay out of
    // the webpack bundle, and file tracing cannot see that binary on its own.
    serverComponentsExternalPackages: ["@pyroscope/nodejs", "@datadog/pprof"],
    outputFileTracingIncludes: {
      "/**": [
        "./node_modules/@datadog/pprof/package.json",
        "./node_modules/@datadog/pprof/out/src/**/*.js",
        "./node_modules/@datadog/pprof/prebuilds/linux-x64/dd_pprof.node.abi*.node",
        "./node_modules/node-gyp-build/**/*.js",
        "./node_modules/pprof-format/**/*.js",
        "./node_modules/source-map/**/*.js",
      ],
    },
  },
};

export default nextConfig;
