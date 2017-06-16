const template = require( 'babel-template' );

function camelToHypen( str ) {
	return str.replace(/([A-Z])/g, function ( g ) {
		return `-${ g[0].toLowerCase() }`
	}).slice( 1 );
}

const buildComponentCommonImportDeclaration = function ( libraryName ) {
	return template( `
		import KMUI_TMP_install_ from '${ libraryName }/lib/install';
		import '${ libraryName }/lib/index.mcss';
	`, { sourceType: 'module' } );
}

const buildComponentImportDeclaration = function ( libraryName, componentName ) {
	return template( `
		import DEF from '${ libraryName }/lib/components/${ componentName }';
		import '${ libraryName }/lib/components/${ componentName }/index.mcss';
	`, { sourceType: 'module' } );
};

const buildAssignment = function () {
	return template( `
		const NAME = KMUI_TMP_install_( DEF );
	`, { sourceType: 'module' } );
}

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

				if ( lastImport ) {
					lastImport.insertAfter( t.expressionStatement( t.stringLiteral( 'placeholder' ) ) );
					const placeholder = lastImport.getSibling( lastImport.key + 1 );

					this._cache.placeholder = placeholder;
				}
			},

			ImportDeclaration( path, { opts } ) {
				const self = this;
				const placeholder = this._cache.placeholder;
				const libraryName = opts.libraryName || 'kmui';

				if ( path.node.source.value === libraryName ) {
					let hasImportDeclaration = false;

					path.node.specifiers.forEach( function ( specifier ) {
						if ( specifier.type !== 'ImportSpecifier' ) {
							return;
						}

						hasImportDeclaration = true;

						const imported = specifier.imported;

						const ident = path.scope.generateUidIdentifier( 'KMUI_TMP_' );
						path.insertBefore( buildComponentImportDeclaration( libraryName, camelToHypen( imported.name ) )( {
							DEF: ident,
						} ) );

						if ( placeholder ) {
							placeholder.insertAfter( buildAssignment()( {
								NAME: t.identifier( imported.name ),
								DEF: t.identifier( ident.name ),
							} ) );
						}
					} );

					if ( hasImportDeclaration ) {
						path.insertBefore( buildComponentCommonImportDeclaration( libraryName )( {} ) );
					}

					if ( placeholder ) {
						placeholder.remove();
					}

					path.remove();
				}
			}
		},

		post() {
			delete this._cache;
		}
	};
};
