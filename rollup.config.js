// @ts-check
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';
import mwGadget from 'rollup-plugin-mediawiki-gadget';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/Gadget-text-autospace.js',
    format: 'iife',
    inlineDynamicImports: true,
    banner: readFileSync('./assets/intro.js').toString().trim(),
    footer: readFileSync('./assets/outro.js').toString().trim(),
  },
  plugins: [
    typescript(),
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
