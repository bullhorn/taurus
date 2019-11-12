import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2'
import license from 'rollup-plugin-license'
import uglify from 'rollup-plugin-uglify';

const pkg = require('./package');

export default [
  // browser-friendly UMD build
	{
    input: './src/index.ts',
    external: ['@bullhorn/bullhorn-types', 'axios', 'rxjs'],
		output: { file: pkg.browser, format: 'umd', name: 'taurus' },
		plugins: [
      typescript({ cacheRoot: `${require('temp-dir')}/.rpt2_cache` }),
      resolve({ jsnext: true, preferBuiltins: true, browser: true }),
      json(),
      commonjs(),
      license({ banner: path.join(__dirname, 'LICENSE') }),
      uglify(),
      sourcemaps()
    ],
    onwarn: ( warning ) => {
      if ( warning.code === 'THIS_IS_UNDEFINED' ) return;
      if ( warning.code === 'UNRESOLVED_IMPORT' ) return;
      if ( warning.code === 'MISSING_GLOBAL_NAME' ) return;
      console.warn("Rollup warning: ", warning);
    }
	},
	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify 
	// `file` and `format` for each target)
	{
    input: './src/index.ts',
    external: ['@bullhorn/bullhorn-types', 'axios', 'rxjs'],
		output: [
 			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
    ],
    plugins: [
      typescript({ cacheRoot: `${require('temp-dir')}/.rpt2_cache` }),
      resolve({ jsnext: true, preferBuiltins: true, browser: true }),
      json(),
      commonjs(),
      license({ banner: path.join(__dirname, 'LICENSE') }),
      sourcemaps()
    ],
    onwarn: ( warning ) => {
      if ( warning.code === 'THIS_IS_UNDEFINED' ) return;
      console.warn("Rollup warning: ", warning);
    }
  }
];