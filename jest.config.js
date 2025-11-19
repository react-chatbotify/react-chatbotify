export default {
	testEnvironment: 'jsdom',
	setupFiles: ['<rootDir>/setup.jest.js'],
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(jpg|jpeg|png|gif|svg|wav)(\\?react)?$': '<rootDir>/__tests__/__mocks__/fileMock.ts',
		"^(\\.\\/.+)\\.js$": "$1",
	},
	transform: {
		'^.+\\.(t|j)sx?$': ['ts-jest', { useESM: true }],
	},
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	testPathIgnorePatterns: [
		"__tests__/__mocks__"
	],
};