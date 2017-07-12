const gulp = require('gulp')
const changed = require('gulp-changed')
const typescript = require('gulp-typescript')

const ts = typescript.createProject('tsconfig.json')

const DEST = 'app'

gulp.task('default', () => {
	gulp.src('src/**/*.ts').pipe(changed(DEST, { extension: 'js' })).pipe(ts()).pipe(gulp.dest(DEST))
})