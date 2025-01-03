const esModules = [
  '@jupyterlab',
  '@codemirror',
  '@lumino',
  'lib0',
  'y-protocols',
  'y-websocket',
  'yjs'
].join('|');

module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: true
    }]
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [`/node_modules/(?!(${esModules})).+`],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/test/styleMock.js',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/test/fileMock.js',
    '^@jupyterlab/(.*)$': '<rootDir>/node_modules/@jupyterlab/$1/lib'
  },
  moduleDirectories: ['node_modules'],
  preset: 'ts-jest/presets/js-with-babel'
};
