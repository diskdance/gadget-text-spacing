// @ts-check
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-import-css';
import mwGadget from 'rollup-plugin-mediawiki-gadget';
import { readFileSync } from 'fs';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/Gadget-text-spacing.js',
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
  ],
});
