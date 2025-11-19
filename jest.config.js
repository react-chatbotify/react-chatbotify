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
};