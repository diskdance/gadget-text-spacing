// @ts-check
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';
import mwGadget from 'rollup-plugin-mediawiki-gadget';
import css from 'rollup-plugin-import-css';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/Gadget-zh-kerning.js',
    assetFileNames: '[name][extname]',
    format: 'iife',
    inlineDynamicImports: true,
    banner: readFileSync('./assets/intro.js').toString().trim(),
    footer: readFileSync('./assets/outro.js').toString().trim(),
  },
  plugins: [
    typescript(),
    css(),
    mwGadget({
      gadgetDef: '.gadgetdefinition',
    }),
    /* terser({
       format: {
         comments: /(^\*!|nowiki)/i, // Preserve banners & nowiki guards
       },
     }), */
  ],
});
