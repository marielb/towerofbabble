module.exports = function( grunt ) {

"use strict";

var
	// files
	coreFiles = [
		"jquery.ui.core.js",
		"jquery.ui.widget.js",
		"jquery.ui.mouse.js",
		"jquery.ui.draggable.js",
		"jquery.ui.droppable.js",
		"jquery.ui.resizable.js",
		"jquery.ui.selectable.js",
		"jquery.ui.sortable.js",
		"jquery.ui.effect.js"
	],

	uiFiles = coreFiles.map(function( file ) {
		return "ui/" + file;
	}).concat( expandFiles( "ui/*.js" ).filter(function( file ) {
		return coreFiles.indexOf( file.substring(3) ) === -1;
	})),

	allI18nFiles = expandFiles( "ui/i18n/*.js" ),

	cssFiles = [
		"core",
		"accordion",
		"autocomplete",
		"button",
		"datepicker",
		"dialog",
		"menu",
		"progressbar",
		"resizable",
		"selectable",
		"slider",
		"spinner",
		"tabs",
		"tooltip",
		"theme"
	].map(function( component ) {
		return "themes/base/jquery.ui." + component + ".css";
	}),

	// minified files
	minify = {
		options: {
			preserveComments: false
		},
		bundleJs: {
			options: {
				banner: createBanner( uiFiles )
			},
			files: {
				"dist/jquery-ui.min.js": "dist/jquery-ui.js"
			}
		},
		bundleI18n: {
			options: {
				banner: createBanner( allI18nFiles )
			},
			files: {
				"dist/i18n/jquery-ui-i18n.min.js": "dist/i18n/jquery-ui-i18n.js"
			}
		}
	},

	minifyCSS = {
		options: {
			keepSpecialComments: 0
		},
		bundle: {
			options: {
				keepSpecialComments: "*"
			},
			src: "dist/jquery-ui.css",
			dest: "dist/jquery-ui.min.css"
		}
	},

	compareFiles = {
		all: [
			"dist/jquery-ui.js",
			"dist/jquery-ui.min.js"
		]
	};

function mapMinFile( file ) {
	return "dist/" + file.replace( /\.js$/, ".min.js" ).replace( /ui\//, "minified/" );
}

function expandFiles( files ) {
	return grunt.util._.pluck( grunt.file.expandMapping( files ), "src" ).map(function( values ) {
		return values[ 0 ];
	});
}

uiFiles.concat( allI18nFiles ).forEach(function( file ) {
	minify[ file ] = {
		options: {
			banner: createBanner()
		},
		files: {}
	};
	minify[ file ].files[ mapMinFile( file ) ] = file;
});

cssFiles.forEach(function( file ) {
	minifyCSS[ file ] = {
		options: {
			banner: createBanner()
		},
		src: file,
		dest: "dist/" + file.replace( /\.css$/, ".min.css" ).replace( /themes\/base\//, "themes/base/minified/" )
	};
});

uiFiles.forEach(function( file ) {
	// TODO this doesn't do anything until https://github.com/rwldrn/grunt-compare-size/issues/13
	compareFiles[ file ] = [ file,  mapMinFile( file ) ];
});

// grunt plugins
grunt.loadNpmTasks( "grunt-compare-size" );
grunt.loadNpmTasks( "grunt-contrib-clean" );
grunt.loadNpmTasks( "grunt-contrib-concat" );
grunt.loadNpmTasks( "grunt-contrib-csslint" );
grunt.loadNpmTasks( "grunt-contrib-cssmin" );
grunt.loadNpmTasks( "grunt-contrib-jshint" );
grunt.loadNpmTasks( "grunt-contrib-qunit" );
grunt.loadNpmTasks( "grunt-contrib-requirejs" );
grunt.loadNpmTasks( "grunt-contrib-uglify" );
grunt.loadNpmTasks( "grunt-git-authors" );
grunt.loadNpmTasks( "grunt-html" );
// local testswarm and build tasks
grunt.loadTasks( "build/tasks" );

function stripDirectory( file ) {
	return file.replace( /.+\/(.+?)>?$/, "$1" );
}

function createBanner( files ) {
	// strip folders
	var fileNames = files && files.map( stripDirectory );
	return "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
		"<%= grunt.template.today('isoDate') %>\n" +
		"<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
		(files ? "* Includes: " + fileNames.join(", ") + "\n" : "")+
		"* Copyright <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
		" Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n";
}

grunt.initConfig({
	pkg: grunt.file.readJSON("package.json"),
	files: {
		dist: "<%= pkg.name %>-<%= pkg.version %>"
	},
	compare_size: compareFiles,
	concat: {
		css: {
			options: {
				banner: createBanner( cssFiles ),
				stripBanners: {
					block: true
				}
			},
			src: cssFiles,
			dest: "dist/jquery-ui.css"
		}
	},
	uglify: minify,
	cssmin: minifyCSS,
	htmllint: {
		// ignore files that contain invalid html, used only for ajax content testing
		all: grunt.file.expand( [ "demos/**/*.html", "tests/**/*.html" ] ).filter(function( file ) {
			return !/(?:ajax\/content\d\.html|tabs\/data\/test\.html|tests\/unit\/core\/core.*\.html)/.test( file );
		})
	},
	copy: {
		dist_units_images: {
			src: "themes/base/images/*",
			strip: /^themes\/base\//,
			dest: "dist/"
		}
	},
	qunit: {
		files: expandFiles( "tests/unit/**/*.html" ).filter(function( file ) {
			// disabling everything that doesn't (quite) work with PhantomJS for now
			// TODO except for all|index|test, try to include more as we go
			return !( /(all|index|test|dialog|tooltip)\.html$/ ).test( file );
		})
	},
	jshint: {
		bundleJs: {
			options: {
				jshintrc: ".bundlejshintrc"
			},
			files: {
				src: "dist/jquery-ui.js"
			}
		},
		bundleI18n: {
			options: {
				jshintrc: ".bundlejshintrc"
			},
			files: {
				src: "dist/jquery-ui-i18n.js"
			}
		},
		ui: {
			options: {
				jshintrc: "ui/.jshintrc"
			},
			files: {
				src: "ui/*.js"
			}
		},
		grunt: {
			options: {
				jshintrc: ".jshintrc"
			},
			files: {
				src: [ "Gruntfile.js", "build/**/*.js" ]
			}
		},
		tests: {
			options: {
				jshintrc: "tests/.jshintrc"
			},
			files: {
				src: "tests/unit/**/*.js"
			}
		}
	},
	csslint: {
		base_theme: {
			src: "themes/base/*.css",
			options: {
				csslintrc: ".csslintrc"
			}
		}
	},
	preRequirejs: {
		bundle: {
			components: uiFiles.map(function( file ) {
				return file.replace( /ui\//, "" );
			}),
			dest: "dist/tmp/main.js"
		},
		bundleI18n: {
			components: allI18nFiles.map(function( file ) {
				return file.replace( /ui\//, "" );
			}),
			dest: "dist/tmp/mainI18n.js"
		}
	},
	requirejs: {
		options: {
			dir: "dist/build",
			appDir: "ui",
			baseUrl: ".",
			optimize: "none",
			optimizeCss: "none",
			paths: {
				jquery: "../jquery-1.9.1",
				jqueryui: ".",
				tmp: "../dist/tmp"
			},
			wrap: {
				start: createBanner() + "(function( $ ) {",
				end: "})( jQuery );"
			},
			onBuildWrite: function ( id, path, contents ) {
				if ( (/define\([\s\S]*?factory/).test( contents ) ) {
					// Remove UMD wrapper
					contents = contents.replace( /\(function\( factory[\s\S]*?\(function\( \$ \) \{/, "" );
					contents = contents.replace( /\}\)\);\s*?$/, "" );
				}
				else if ( (/^require\(\[/).test( contents ) ) {
					// Replace require with comment `//` instead of null string, because of the mysterious semicolon
					contents = contents.replace( /^require[\s\S]*?\]\);$/, "// mysterious semicolon: " );
				}
				return contents;
			}
		},
		bundle: {
			options: {
				modules: [{
					name: "../jquery-ui",
					include: [ "tmp/main" ],
					exclude: [ "jquery" ],
					create: true
				}]
			}
		},
		bundleI18n: {
			options: {
				modules: [{
					name: "../i18n/jquery-ui-i18n",
					include: [ "tmp/mainI18n" ],
					exclude: [ "jquery", "jqueryui/jquery.ui.core", "jqueryui/jquery.ui.datepicker" ],
					create: true
				}]
			}
		}
	},
	postRequirejs: {
		bundle: [ "dist/build/jquery-ui.js" ],
		bundleI18n: [ "dist/build/jquery-ui-i18n.js" ]
	},
	clean: {
		dist: [ "dist" ],
		distGarbage: [ "dist/build", "dist/tmp" ]
	}
});

grunt.registerMultiTask( "preRequirejs", "Create require that will include appropriate components' dependencies", function() {
	if ( this.data.components.length ) {
		grunt.file.write( this.data.dest, "require([\n\t\"jqueryui/" + this.data.components.map(function( file ) {
			return file.replace( /\.js/, "" );
		}).join( "\",\n\t\"jqueryui/" ) + "\"\n]);" );
	}
});

grunt.registerMultiTask( "postRequirejs", "Strip define call from dist file", function() {
	this.filesSrc.forEach(function( filepath ) {
		// Remove `define("main" ...)` and `define("jquery-ui" ...)`
		var contents = grunt.file.read( filepath ).replace( /define\("(main|jquery-ui)", function\(\)\{\}\);/g, "" );

		// Remove the mysterious semicolon `;` character left from require([...]);
		contents = contents.replace( /\/\/ mysterious semicolon.*/g, "" );

		grunt.file.write( filepath, contents );
	});
});

grunt.registerTask( "default", [ "lint", "test" ] );
grunt.registerTask( "lint", [ "jshint", "csslint", "htmllint" ] );
grunt.registerTask( "test", [ "copy:dist_units_images", "qunit" ] );
grunt.registerTask( "sizer", [ "concat:ui", "uglify:bundle", "compare_size:bundle" ] );
grunt.registerTask( "sizer_all", [ "concat:ui", "uglify", "cssmin", "compare_size" ] );
grunt.registerTask( "build", [ "clean", "preRequirejs", "requirejs", "postRequirejs", "clean:distGarbage", "jshint:bundleJs", "uglify:bundleJs", "uglify:bundleI18n", "concat:css", "cssmin:bundle" ] );

};
