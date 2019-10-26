module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    dirs: {
      dest: "dist"
    },

    vars: {},

    concat: {
      options: { process: true },
      dist: {
        src: [
          "src/js/umd-head.js",
          "src/js/setup.js",
          "src/js/skins.js",

          // helpers
          "src/js/helpers/bounds.js",
          "src/js/helpers/browser.js",
          "src/js/helpers/helpers.js",
          "src/js/helpers/support.js",
          "src/js/helpers/imageready.js",
          "src/js/helpers/timers.js",
          "src/js/helpers/url.js",
          "src/js/helpers/vimeothumbnail.js",
          "src/js/helpers/vimeoready.js",

          "src/js/options.js",
          "src/js/loading.js",
          "src/js/overlay.js",
          "src/js/window.js",
          "src/js/keyboard.js",
          "src/js/page.js",
          "src/js/pages.js",
          "src/js/view.js",
          "src/js/spinner.js",

          "src/js/api.js",

          "src/js/thumbnails.js",
          "src/js/thumbnail.js",
          "src/js/ui.js",
          "src/js/ui-fullclick.js",
          "src/js/ui-inside.js",
          "src/js/ui-outside.js",

          "src/js/umd-tail.js"
        ],
        dest: "<%= dirs.dest %>/js/fresco.js"
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: "src/css/",
            src: ["**"],
            dest: "<%= dirs.dest %>/css/"
          }
        ]
      }
    },

    uglify: {
      dist: {
        options: {
          output: {
            comments: "some"
          }
        },
        src: ["<%= dirs.dest %>/js/fresco.js"],
        dest: "<%= dirs.dest %>/js/fresco.min.js"
      }
    },

    clean: {
      dist: "dist/"
    },

    watch: {
      scripts: {
        files: ["src/**/*.js", "src/**/*.css"],
        tasks: ["default"],
        options: {
          spawn: false
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", [
    "clean:dist",
    "concat:dist",
    "copy:dist",
    "uglify:dist"
  ]);
};
