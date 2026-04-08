export default {
	preset: 'ts-jest/presets/js-with-ts-esm',
	testEnvironment: 'jsdom',
	setupFiles: ['<rootDir>/setup.jest.js'],
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(jpg|jpeg|png|gif|svg|wav)(\\?react)?$': '<rootDir>/__tests__/__mocks__/fileMock.ts',
	},
	transform: {
		'^.+\\.ts?$': 'ts-jest',
	},
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	testPathIgnorePatterns: [
		"__tests__/__mocks__"
	],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/index.tsx',
		'!src/devIndex.tsx',
		'!src/App.tsx',
		'!src/viteconfig.ts',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'json-summary'],
	coverageThreshold: {
		global: {
			statements: 75,
			branches: 55,
			functions: 65,
			lines: 75,
		},
	},
};