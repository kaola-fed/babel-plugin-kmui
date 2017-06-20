const path = require( 'path' );
const fs = require( 'fs' );
const { transformFileSync } = require( 'babel-core' );
const plugin = require.resolve( '../lib' );

test( 'should transform import decl correctly', function () {
	const code = transformFileSync( path.resolve( __dirname, 'fixtures/index.js' ), {
		// presets: [ [
		// 	'es2015',
		// ] ],
		plugins: [ [ plugin, { libraryName: 'kmui' } ] ],
	} ).code;

	const expected = fs.readFileSync( path.join( __dirname, 'fixtures/expected.js' ) );

	expect( code.trim() ).toBe( expected.toString().trim() );
} );
