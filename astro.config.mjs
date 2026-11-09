// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// The site lives at https://efrahdev.github.io/Learning/
// If the repo is renamed or moved to a custom domain, change `site` and `base` here (nowhere else).
export default defineConfig({
  site: 'https://efrahdev.github.io',
  base: '/Learning',
  trailingSlash: 'always',
  // React powers the rich islands (home page, library map). Lesson pages ship no React.
  integrations: [mdx(), react()],
  markdown: {
    // Maths: $…$ inline and $$…$$ blocks, drawn by KaTeX at build time (no maths JavaScript in the browser).
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
    // Code colours follow light/dark mode through CSS variables (see src/styles/prose.css).
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, wrap: true },
  },
});
