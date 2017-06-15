const path = require( 'path' );
const { transformFileSync } = require( 'babel-core' );
const plugin = require.resolve( '../lib' );

const code = transformFileSync( path.resolve( __dirname, 'fixtures/index.js' ), {
	presets: [ [
		'es2015',
	] ],
	plugins: [ [ plugin, { libraryName: 'kmui' } ] ],
} ).code;

console.log( code );
