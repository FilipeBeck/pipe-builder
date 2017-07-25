const test = require('unit.js')
const builder = require('../app/main')
const ts = require('gulp-typescript').createProject('tsconfig.json')
const filter = require('gulp-filter')
const del = require('del')
const gulp = require('gulp')

const SRC = 'tests/input-files/**/*'
const DEST = 'tests/output-files'
const WAIT_TIME = 1000

del('tests/output-files/**/*')

const inputStreams = []
const outputStreams = []

let executedTasks = []
let areExecutedPromises = false

describe('Testando pipe-builder', () => {
	builder.build({
		src: SRC,
		dest: DEST,
		tasks: {
			'task-1': (s, id) => {
				it("argumentos de 'task-1'", () => {
					test.assert(s && id)
					executedTasks.push(id)
				})
				return s
			},
			'task-2': (s, id) => {
				it("argumentos de 'task-2'", () => {
					test.assert(s && id)
					executedTasks.push(id)
				})
				return s
			}
		}
	}, {
		input: (s, id) => {
			it('não-nulabilidade dos argumentos das funções de entrada', () => {
				test.assert(s && id)
			})

			it('não-repetitividade de streams nas funções de entrada', () => {
				test.assert(inputStreams.indexOf(s) == -1)
				inputStreams.push(s)
			})

			return s
		},
		output: (s, id) => {
			it('não-nulabilidade dos argumentos das funções de saída', () => {
				test.assert(s && id)
			})

			it('não-repetitividade de streams nas funções de saída', () => {
				test.assert(outputStreams.indexOf(s) == -1)
				outputStreams.push(s)
			})

			return s
		}
	}).then(() => {
		areExecutedPromises = true
	})

	it('todas tarefas executadas', done => {
		test.wait(WAIT_TIME, () => {
			test.assert(executedTasks.indexOf('task-1') != -1 && executedTasks.indexOf('task-2') != -1)
			done()
		})
	})

	const SHOULD_EXECUTE_FLAG = '--should-execute'
	const NOT_EXECUTE_FLAG = '--not-execute'
	const ALL_EXECUTE_FLAG = '--'
	
	builder.argv[SHOULD_EXECUTE_FLAG] = true
	builder.argv[NOT_EXECUTE_FLAG] = false
	builder.argv[ALL_EXECUTE_FLAG] = false

	builder.build({
		src: SRC,
		dest: DEST,
		tasks: {
			'task-3': null
		}
	}, {
		output: {
			[SHOULD_EXECUTE_FLAG]: s => {
				executedTasks.push(SHOULD_EXECUTE_FLAG)
				return s
			},
			[NOT_EXECUTE_FLAG]: s => {
				executedTasks.push(NOT_EXECUTE_FLAG)
				return s
			},
			[ALL_EXECUTE_FLAG]: s => {
				executedTasks.push(ALL_EXECUTE_FLAG)
				return s
			}
		}
	})

	it(`flag '${SHOULD_EXECUTE_FLAG}'`, done => {
		test.wait(WAIT_TIME, () => {
			test.assert(executedTasks.indexOf(SHOULD_EXECUTE_FLAG) != -1)
			done()
		})
	})
	it(`flag '${NOT_EXECUTE_FLAG}'`, done => {
		test.wait(WAIT_TIME, () => {
			test.assert(executedTasks.indexOf(NOT_EXECUTE_FLAG) == -1)
			done()
		})
	})
	it(`flag '${ALL_EXECUTE_FLAG}'`, done => {
		test.wait(WAIT_TIME, () => {
			test.assert(executedTasks.indexOf(ALL_EXECUTE_FLAG) != -1)
			done()
		})
	})
	it ('promise execution', done => {
		test.wait(WAIT_TIME, () => {
			test.assert(areExecutedPromises)
			done()
		})
	})
})