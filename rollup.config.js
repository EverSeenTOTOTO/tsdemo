import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import svelte from 'rollup-plugin-svelte';
import copy from 'rollup-plugin-copy';
// import { terser } from 'rollup-plugin-terser';
import path from 'path';
import pkg from './package.json';

const extensions = ['.mjs', '.js', '.ts', '.json', '.node'];
const plugins = [
  json(),
  alias({
    entries: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@test', replacement: path.resolve(__dirname, 'src/__tests__') },
    ],
  }),
  svelte({
    emitCss: false,
  }),
  resolve({
    extensions,
  }),
  commonjs(),
  babel({
    babelHelpers: 'runtime',
    extensions,
  }),
  // terser({
  //   mangle: true,
  //   compress: true,
  // }),
];

export default [
  {
    external: Object.keys(pkg.dependencies),
    input: path.resolve(__dirname, 'src/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'dist/index.js'),
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      ...plugins,
      copy({
        targets: [
          {
            src: 'node_modules/z3-solver/build/z3-built*',
            dest: 'dist',
          },
        ],
      }),
    ],
  },
  {
    input: path.resolve(__dirname, 'src/web/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'dist/web/app.js'),
        format: 'umd',
        name: 'App',
        sourcemap: true,
      },
    ],
    watch: {
      buildDelay: 1000,
      include: [
        'src/web/**',
        'public/**',
      ],
    },
    plugins: [
      ...plugins,
      copy({
        targets: [
          {
            src: 'public/index.html',
            dest: 'dist/web',
          },
        ],
      }),
    ],
  },
];
