```typescript
function build(buildings: Building|Building[], defaultInOutBuilding?: InOutBuilding)
```
Executa as construções especificadas

## Exemplo 1

```typescript
build([
  {
    // Caminho fonte - argumento para `gulp.src()`.
    src: ['path-to-app-lib/**/*', 'path-to-third-lib/**/*'],
    // Caminho de destino - argumento para `gulp.dest()`.
    dest: 'path-to-dest',
    // Extensão do arquivo. Quando fornecido, filtra apenas os arquivos modificados na entrada. Use '*' quando as extensões forem mistas.
    // Quando não fornecido, não haverá filtragem.
    extension: '*',
    // Uma ou mais tarefas a serem executadas nas entradas, já filtradas se 'extension' for fornecido.
    tasks: {
      // Tarefa com o identificador 'typescript' deve ser único (inclusive, entre chamadas posteriores de `build()`).
      // O valor deve ser uma função que receberá a stream retornada por Gulp e o identificador da tarefa, e deve retornar uma stream, ou
      // `null`, resultando em uma operação de cópia.
      'typescript': (stream, taskId) => stream.pipe(filter('**/*.ts')).pipe(typescript()),
      // Tarefa com o identificador 'javascript'.
      'javascript': (stream, taskId) => stream.pipe(filter('**/*.js'))
    }
  }
], {
  // Tarefas executadas antes de cada tarefa (nesse caso, antes de 'typescript' e antes de 'javascript').
  input: {
    // Executada apenas se a flag '--production' for fornecida (via linha de comando, ou modificando em `argv`).
    '--production': (stream, taskId) => stream.pipe(removeDebugFlags())
  },
  // Tarefas executadas depois de cada tarefa (nesse caso, depois de 'typescript' e depois de 'javascript').
  output: {
    // Executada apenas se a flag '--production' for fornecida (via linha de comando, ou modificando em `argv`).
    '--production': (stream, taskId) => stream.pipe(minify())
    // Executada sempre, independente das flags fornecidas.
    '--': (stream, taskId) => stream.pipe(optimizer())
  }
})
```

## Exemplo 2

```typescript
build({
  // Caminho fonte - argumento para `gulp.src()`.
  src: 'path-to-lib/**/*.js',
  // Caminho de destino - argumento para `gulp.dest()`.
  dest: 'path-to-dest',
  // Mesmo que a extensão seja sempre '.js', a propriedade `extension' deve ser fornecida para haver filtragem dos arquivos modificados.
  extension: 'js',
  // Uma ou mais tarefas a serem executadas nas entradas, já filtradas se 'extension' for fornecido.
  tasks: {
    // Tarefa com o identificador 'assemble-as-amd'.
    'assemble-as-amd': (stream, taskId) => stream.pipe(changeExtension('amd.js'))
    // Tarefa com o identificador 'assemble-as-umd'.
    'assemble-as-umd': (stream, taskId) => stream.pipe(changeExtension('umd.js'))
  }, {
    // Se houver apenas uma tarefa e não necessitar alguma flag, pode-se fronecer uma função diretamente.
    output: (stream, taskId) => stream.pipe(minify())
  }
})
```

```typescript
const argv: Dictionary<string>
```
Flags fornecidas via linha de comando. Podem ser modificadas antes de invocar `build()` para alterar a execução das tarefas de entrada e saída.

```typescript
function successMessage(...messages: any[])
```
Imprime as mensagens especificadas, concatenadas com a string ' - ' e com a cor verde.

```typescript
function errorMessage(...messages: any[])
```
Imprime as mensagens especificadas, concatenadas com a string ' - ' e com a cor vermelha.