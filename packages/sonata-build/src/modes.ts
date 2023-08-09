import { rollup, InputOptions, OutputOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'

const inputOptions: InputOptions = {
  input: `${process.cwd()}/dist/index.js`,
  plugins: [
    commonjs({
      ignoreDynamicRequires: true
    }),
    nodeResolve(),
    json(),
    terser()
  ],
  external: [
    /node_modules/,
  ],
  onwarn: () => null
}


const outputOptions: OutputOptions = {
  dir: 'release',
  format: 'cjs',
  sourcemap: false,
}

export const build = async () => {
  const bundle = await rollup(inputOptions)
  await bundle.write(outputOptions)

  bundle?.close()
}
