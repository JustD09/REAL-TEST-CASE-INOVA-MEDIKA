export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  transformIgnorePatterns: ['node_modules/(?!(@mui|@emotion|@testing-library)/)'],
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json'],
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/test/**',
  ],
};