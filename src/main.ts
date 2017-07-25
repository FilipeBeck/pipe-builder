import * as colors from 'colors/safe'
import * as yargs from 'yargs'
import * as gulp from 'gulp'
import * as changed from 'gulp-changed'
import * as vinylFs from "vinyl-fs"

/** Lista de todas as tarefas já registradas. */
const taskIds: string[] = []

/**
 * Opções pra `gulp.src()`.
 */
export type SrcOptions = vinylFs.SrcOptions

/**
 * Opções para `gulp.dest()` (a definição no arquivo original é anônima).
 * Copiado de "/node_modules/@types/vinyl-fs/index.d.ts":141.
 */
export type DestOptions = {
   /**
		* Specify the working directory the folder is relative to
    * Default is process.cwd()
    */
   cwd?: string;
   /**
		* Specify the mode the files should be created with
    * Default is the mode of the input file (file.stat.mode)
    * or the process mode if the input file has no mode property
    */
   mode?: number|string;
   /** Specify the mode the directory should be created with. Default is the process mode */
   dirMode?: number|string;
   /** Specify if existing files with the same path should be overwritten or not. Default is true, to always overwrite existing files */
   overwrite?: boolean;
}

/**
 * Uma caixinha de globs-globs.
 */
export type Globs = string|string[]

/**
 * Objeto indexável.
 */
export interface Dictionary<T>
{ /** Operador de subscript. */
	[key: string]: T
}

/**
 * Caminho de entrada.
 */
export interface SrcPath
{
	/** Caminho ou lista de caminhos. */
	path: string|string[],
	/** Opções. */
	options: SrcOptions
}

/**
 * Caminho de saída.
 */
export interface DestPath
{
	/** Caminho. */
	path: string,
	/** Opções. */
	options: DestOptions
}

/**
 * Objetos passados para `builder()`
 */
export interface Building
{
	/** Arquivos dontes. */
	src: Globs|SrcPath,
	/** Arquivos de destino. */
	dest: Globs|DestPath,
	/** Extensão dos arquivos de saída. */
	extension?: string
	/** Tarefa ou lista de tarefas a serem executadas. Se alguma for `null`, a tarefa se resume a uma operação de cópia. */
	tasks: Dictionary<StreamCallback|null>
	/** Lista de flags de guarda. Se houver. A construção será executada somente se todas as flags da lista forem passadas na linha de commando (ex.: '--dev'). */
	flags?: string|string[],
	/** Mensages a serem exibidas quando a construção finalizar, concatenadas com ' - '. */
	messages?: string|string[]
}

/**
 * Invocado entre as tarefas.
 */
export type StreamCallback = (stream: NodeJS.ReadWriteStream, taskId?: string) => NodeJS.ReadWriteStream

/**
 * Tarefas executadas antes e/ou depois de cada construção
 */
export interface InOutBuilding
{
	/** Tarefas de entrada. Recebe a `stream` retornada de `gulp.src()` e deve retornar a stream. */
	input?: StreamCallback|Dictionary<StreamCallback>,
	/** Tarefas de saída. Recebe a `stream` retornada da última operação e deve retornar a stream para `gulp.dest`. */
	output?: StreamCallback|Dictionary<StreamCallback>
}

export const argv: Dictionary<string> = {}

for (const key in yargs.argv)
	argv['--' + key] = yargs.argv[key]

/**
 * 
 * @param buildings - Array de construções com uma ou mais tarefas. A tarefa pode ser `null`, resultando em uma operação de cópia.
 * @param defaultOutBuilding
 */

export function build(buildings: Building|Building[], defaultInOutBuilding?: InOutBuilding): Promise<void[]>
{ // Formata `buildings` para `Array`
	buildings = buildings instanceof Array ? buildings : [buildings]
	// Formata `defaultInOutBuilding` para conter `Dictionary<StreamCalback>`
	defaultInOutBuilding = defaultInOutBuilding || { input: {}, output: {} }
	// InOut como dicionário
	const inOutBuilding = defaultInOutBuilding as Dictionary<any>
	// Itera a entrada e saída
	for (const key of ['input', 'output']) {
		if (!inOutBuilding[key])
			inOutBuilding[key] = {}
		else if (typeof inOutBuilding[key] === 'function')
			inOutBuilding[key] = { '--': inOutBuilding[key] }
	}
	// Promessas de todas as execuções
	const promises: Promise<void>[] = []
	// Stream de encadeamento
	let stream: NodeJS.ReadWriteStream

	for (const building of buildings) {
		// Não executa a construção se não houver alguma das flags fornecidas
		// TODO: Analizar e, se for útil, implementar essa característica (NÂO É USADA ATUALMENTE)
		if (building.flags)
			for (const flag of building.flags)
				if (!(flag in argv))
					continue
		
		const srcPath = (building.src as SrcPath).path || building.src as string|string[]
		const srcOptions = (building.src as SrcPath).options
		const destPath = (building.dest as DestPath).path || building.dest as string
		const destOptions = (building.dest as DestPath).options

		for (const taskId in building.tasks) {
			if (taskIds.indexOf(taskId) != -1) {
				throw new Error(`Tarefa com identificador '${name}' já existe.`)
			}

			promises.push(new Promise<void>((resolve, reject) => {
				// Lê entrada/s
				stream = gulp.src(srcPath, srcOptions)
			
				if (building.extension && !argv['--overwite-all'])
					stream = stream.pipe(changed(destPath, building.extension != '*' ? { extension: building.extension } : undefined))
	
				const inputBuilding = (defaultInOutBuilding as InOutBuilding).input as Dictionary<StreamCallback>
				// Executa as tarefas de entrada
				for (const key in inputBuilding)
					if (key == '--' || argv[key])
						stream = inputBuilding[key](stream, taskId)
				
				const task = building.tasks[taskId] as StreamCallback
				
				if (task)
					stream = task(stream, taskId)
	
				const outputBuilding = (defaultInOutBuilding as InOutBuilding).output as Dictionary<StreamCallback>
				// Executa as tarefas de saída
				for (const key in outputBuilding)
					if (key == '--' || argv[key])
						stream = outputBuilding[key](stream, taskId)
	
				stream.pipe(gulp.dest(destPath, destOptions)).on('end', () => {
					const messages = !building.messages ? ['Finished'] : building.messages instanceof Array ? building.messages : [building.messages]
					successMessage(`Task '${taskId}'`, ...messages)
					resolve()
				})
			}))
		}
	}

	return Promise.all(promises)
}

/**
 * Imprime as mensagens especificadas, concatenadas com a string ' - ' e com a cor verde.
 * @param messages - Mensagens a serem concatenadas com a string ' - '.
 */
export function successMessage(...messages: any[])
{
	console.log(colors.green(messages.join(' - ')))
}

/**
 * Imprime as mensagens especificadas, concatenadas com a string ' - ' e com a cor vermelha.
 * @param messages - Mensagens a serem concatenadas com a string ' - '.
 */
export function errorMessage(...messages: any[])
{
	console.log(colors.red(messages.join(' - ')))
}