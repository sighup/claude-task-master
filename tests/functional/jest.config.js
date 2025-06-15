export default {
	// Use Node.js environment for functional tests
	testEnvironment: 'node',

	// Test timeout for functional tests that involve file watching
	testTimeout: 15000,

	// Transform JS and JSX files
	transform: {
		'^.+\\.(js|jsx)$': 'babel-jest'
	},

	// Module file extensions
	moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

	// Disable transformations for node_modules except for specific packages
	transformIgnorePatterns: [
		'/node_modules/(?!(ink|ink-testing-library|@inkjs|cli-boxes|ansi-escapes|strip-ansi|string-width|wrap-ansi|delay)/)'
	],

	// Setup file
	setupFilesAfterEnv: ['<rootDir>/../setup.js']
};