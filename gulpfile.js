'use strict';

// 引入 gulp
var gulp = require('gulp');

// 引入组件
var replace = require('gulp-replace'),
    clean = require('gulp-clean'),
    gulpif = require('gulp-if'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    stripDebug = require('gulp-strip-debug');

var pkg = require('./package.json');

// var version = 'v' + pkg.version;
var version = 'v1.0';
var cfg = {
    output: './dist/',
    static: {
        pxReg: /(-?\d+(\.\d+)?)px/gi,                               //px像素单位
        curr_path: /(http(s)?:)?\/\/(bianxianmao.com)\/wxapp(\/v\d+(\.\d+)?)?/gi,          //当前ftp静态资源地址
        target_path: 'https://img.bianxianmao.com/wxapp/' + version     //目标cnd静态资源地址
    }
};


//构建开始提示
gutil.log(gutil.colors.green('[Start build]'), '版本:', gutil.colors.magenta(version), ', 输出目录:', gutil.colors.magenta(cfg.output));


//清空dist目录
gulp.task('clean', function () {
    return gulp.src(cfg.output, {read: true})
        .pipe(clean());
});

// clone and replace
gulp.task('clone', function () {
    return gulp.src([
        'src/**/*.js',
        '!src/config/index.js',
        'src/**/*.json',
        'src/**/*.wxml',
        'src/**/*.wxss'
    ])
        .pipe(replace(cfg.static.pxReg, function (m, num) {
            return (num == 1 ? num : 2 * num) + 'rpx';
        }))
        .pipe(gulpif(cfg.online, replace(cfg.static.curr_path, cfg.static.target_path)))
        .pipe(gulp.dest(cfg.output))
});

//替换关键字，less转css
gulp.task('config', function () {
    return gulp.src('src/config/index.js')
        .pipe(gulpif(cfg.online, replace(/env: 'dev',/gi, "env: 'pro',")))
        .pipe(gulp.dest(cfg.output + '/config'))
});


//处理图片
gulp.task('image', function () {
    return gulp.src([
        'src/images/tabbar/**'
    ])
        .pipe(gulp.dest(cfg.output + '/images/tabbar'))
});

//构建dev
gulp.task('build', ['clean'], function () {
    gulp.start(
        'clone',
        'config',
        'image'
    );
});

//构建
gulp.task('build online', ['clean'], function () {
    cfg.online = true;
    gulp.start('build');
});

//默认任务
gulp.task('watch', ['build'], function () {
    gulp.watch([
            'src/**/*.*'
        ],
        ['build']
    );
});

