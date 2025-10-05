import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({

  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [react(), mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },



  build: {
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/
            },
            {
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/
            },
            {
              name: 'chart-vendor',
              test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/
            },
            {
              name: 'lp-solver',
              test: /[\\/]node_modules[\\/]javascript-lp-solver[\\/]/
            },
            {
              name: 'firebase-vendor',
              test: /[\\/]node_modules[\\/]firebase[\\/]/
            },
            {
              name: 'utils-vendor',
              test: /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge|date-fns|lucide-react)[\\/]/
            }
          ]
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'test_project'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
        'src/components/ui/**',
      ],
    },
  }

}));
