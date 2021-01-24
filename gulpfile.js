"use strict"

const { src, dest } = require("gulp");

const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const cssbeautify = require("gulp-cssbeautify");
const notify = require('gulp-notify');
const removeComments = require("gulp-strip-css-comments");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const cssnano = require("gulp-cssnano");
const rigger = require("gulp-rigger");
const terser = require("gulp-terser");
const plumber = require("gulp-plumber");
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require("gulp-imagemin");
const group_media = require("gulp-group-css-media-queries");
const del = require("del");
const panini = require("panini");
const browsersync = require("browser-sync").create();
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs');
//finish
//update devtools



var path = {
  build: {
    html: "dist/",
    js: "dist/assets/js/",
    css: "dist/assets/css/",
    images: "dist/assets/img/",
    fonts: "dist/assets/fonts/"
  },
  src: {
    html: "src/*.html",
    js: "src/assets/js/*.js",
    css: "src/assets/sass/style.scss",
    images: "src/assets/img/**/*.{jpg,png,svg,gif,ico}",
    fonts: "src/assets/fonts/**.ttf"
  },
  watch: {
    html: "src/**/*.html",
    js: "src/assets/js/**/*.js",
    css: "src/assets/sass/**/*.scss",
    images: "src/assets/img/**/*.{jpg,png,svg,gif,ico}",
    fonts: "src/assets/fonts/*.ttf"

  },
  clean: "./dist"
}


function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./dist/"
    },
    port: 3000
  });
}

function browserSyncReload(done) {
  browsersync.reload();
}

function fonts() {
  return src('./src/assets/fonts/*.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./dist/assets/fonts/'))
    .pipe(browsersync.stream());
}

const checkWeight = (fontname) => {
  let weight = 400;
  switch (true) {
    case /Thin/.test(fontname):
      weight = 100;
      break;
    case /ExtraLight/.test(fontname):
      weight = 200;
      break;
    case /Light/.test(fontname):
      weight = 300;
      break;
    case /Regular/.test(fontname):
      weight = 400;
      break;
    case /Medium/.test(fontname):
      weight = 500;
      break;
    case /SemiBold/.test(fontname):
      weight = 600;
      break;
    case /Semi/.test(fontname):
      weight = 600;
      break;
    case /Bold/.test(fontname):
      weight = 700;
      break;
    case /ExtraBold/.test(fontname):
      weight = 800;
      break;
    case /Heavy/.test(fontname):
      weight = 700;
      break;
    case /Black/.test(fontname):
      weight = 900;
      break;
    default:
      weight = 400;
  }
  return weight;
}

const cb = () => { }

let srcFonts = 'src/assets/sass/fonts.scss'; /*Подивитись якщо не буде працювати то додати "./"*/
let distFonts = 'dist/assets/fonts/';


const fontsStyle = (done) => {
  let file_content = fs.readFileSync(srcFonts);

  fs.writeFile(srcFonts, '', cb);
  fs.readdir(distFonts, function (err, items) {
    if (items) {
      let c_fontname;
      for (var i = 0; i < items.length; i++) {
        let fontname = items[i].split('.');
        fontname = fontname[0];
        let font = fontname.split('-')[0];
        let weight = checkWeight(fontname);

        if (c_fontname != fontname) {
          fs.appendFile(srcFonts, '@include font-face("' + font + '", "' + fontname + '", ' + weight + ');\r\n', cb);
        }
        c_fontname = fontname;
      }
    }
  })

  done();
}

function html() {
  panini.refresh();
  return src(path.src.html, { base: "src/" })
    .pipe(plumber())
    .pipe(panini({
      root: 'src/',
      layouts: 'src/tpl/layouts/',
      partials: 'src/tpl/partials/',
      helpers: 'src/tpl/helpers/',
      data: 'src/tpl/data/'
    }))
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css, { base: "src/assets/sass/" })
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(group_media())
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 8 versions'],
      cascade: true
    }))
    .pipe(cssbeautify())
    .pipe(dest(path.build.css))
    .pipe(cssnano({
      zindex: false,
      discardComments: {
        removeAll: true
      }
    }))
    .pipe(removeComments())
    .pipe(rename({
      suffix: ".min",
      extname: ".css"
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js, { base: "src/assets/js/" })
    .pipe(plumber())
    .pipe(rigger())
    .pipe(gulp.dest(path.build.js))
    .pipe(sourcemaps.init())
    .pipe(terser().on("error", notify.onError()))
    .pipe(rename({
      suffix: ".min",
      extname: ".js"
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.images)
    .pipe(dest(path.build.images))
  // .pipe(browsersync.stream());
}

function clean() {
  return del(path.clean);
}

function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.images], images);
  gulp.watch([path.watch.fonts], fonts);
  gulp.watch([path.watch.fonts], fontsStyle);
}


const build = gulp.series(clean, gulp.parallel(css, html, js, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.html = html;
exports.css = css;
exports.js = js;
exports.fonts = fonts;
exports.images = images;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;


function stylesFinish() {
  return src(path.src.css, { base: "src/assets/sass/" })
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(group_media())
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 8 versions'],
      cascade: true
    }))
    .pipe(cssbeautify())
    .pipe(dest(path.build.css))
    .pipe(cssnano({
      zindex: false,
      discardComments: {
        removeAll: true
      }
    }))
    .pipe(removeComments())
    .pipe(rename({
      suffix: ".min",
      extname: ".css"
    }))
    .pipe(dest(path.build.css))
}

function imagesFinish() {
  return src(path.src.images)
    .pipe(imagemin())
    .pipe(dest(path.build.images))
}

function scriptsFinish() {
  return src(path.src.js, { base: "src/assets/js/" })
    .pipe(plumber())
    .pipe(rigger())
    .pipe(gulp.dest(path.build.js))
    .pipe(terser().on("error", notify.onError()))
    .pipe(rename({
      suffix: ".min",
      extname: ".js"
    }))
    .pipe(dest(path.build.js))
}

const finish = gulp.series(clean, gulp.parallel(html, scriptsFinish, fonts, imagesFinish), fontsStyle, stylesFinish);

exports.finish = finish;