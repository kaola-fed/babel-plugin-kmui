const template = require( 'babel-template' );

function camelToHypen( str ) {
	return str.replace(/([A-Z])/g, function ( g ) {
		return `-${ g[0].toLowerCase() }`
	}).slice( 1 );
}

const buildComponentCommonImportDeclaration = template( `
	import KMUI_TMP_install_ from 'kmui/lib/install';
	import 'kmui/lib/index.mcss';
`, { sourceType: 'module' } );

const buildComponentImportDeclaration = function ( componentName ) {
	return template( `
		import DEF from 'kmui/lib/components/${ componentName }';
		import 'kmui/lib/components/${ componentName }/index.mcss';
	`, { sourceType: 'module' } );
};

const buildAssignment = template( `
	const NAME = KMUI_TMP_install_( DEF );
`, { sourceType: 'module' } );

module.exports = function ( babel ) {
	const { types: t } = babel;

	return {
		name: 'kmui',

		pre() {
			this._cache = {};
		},

		visitor: {
			Program( path ) {
				const imports = [];
				path.traverse( {
					ImportDeclaration( path ) {
						imports.push( path );
					},
				} );

				const lastImport = imports.pop();
				lastImport.insertAfter( t.expressionStatement( t.stringLiteral( 'placeholder' ) ) );
				const placeholder = lastImport.getSibling( 1 );

				this._cache.placeholder = placeholder;
			},

			ImportDeclaration( path ) {
				var self = this;

				if ( path.node.source.value === 'kmui' ) {
					let hasImportDeclaration = false;

					path.node.specifiers.forEach( function ( specifier ) {
						if ( specifier.type !== 'ImportSpecifier' ) {
							return;
						}

						hasImportDeclaration = true;

						const imported = specifier.imported;

						const ident = path.scope.generateUidIdentifier( 'KMUI_TMP_' );
						path.insertBefore( buildComponentImportDeclaration( camelToHypen( imported.name ) )( {
							DEF: ident,
						} ) );

						self._cache.placeholder.insertAfter( buildAssignment( {
							NAME: t.identifier( imported.name ),
							DEF: t.identifier( ident.name ),
						} ) );
					} );

					if ( hasImportDeclaration ) {
						path.insertBefore( buildComponentCommonImportDeclaration( {} ) );
					}

					self._cache.placeholder.remove();
					path.remove();
				}
			}
		},

		post() {
			delete this._cache;
		}
	};
};
