export default {
	// Use Node.js environment for testing
	testEnvironment: 'node',

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',

	// A list of paths to directories that Jest should use to search for files in
	roots: ['<rootDir>/tests'],

	// The glob patterns Jest uses to detect test files
	testMatch: ['**/__tests__/**/*.(js|jsx)', '**/?(*.)+(spec|test).(js|jsx)'],

	// Transform files - apply babel-jest to JSX files and start-ui test files
	transform: {
		'^.+\\.jsx$': 'babel-jest',
		'^.+/start-ui/.+\\.test\\.js$': 'babel-jest'
	},

	// Disable transformations for node_modules except for ink and react
	transformIgnorePatterns: [
		'/node_modules/(?!(ink|ink-testing-library|@inkjs|cli-boxes|ansi-escapes|strip-ansi|string-width|wrap-ansi)/)'
	],

	// Set moduleNameMapper for absolute paths
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1'
	},

	// Setup module aliases
	moduleDirectories: ['node_modules', '<rootDir>'],

	// Module file extensions
	moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

	// Treat these extensions as ESM - only JSX files
	extensionsToTreatAsEsm: ['.jsx'],

	// Configure test coverage thresholds
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},

	// Generate coverage report in these formats
	coverageReporters: ['text', 'lcov'],

	// Verbose output
	verbose: true,

	// Setup file
	setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
