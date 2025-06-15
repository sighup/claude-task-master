#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import App from './modules/start-ui/App.jsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the project root
const projectRoot = path.resolve(__dirname, '..');

console.log('Starting Task Master UI test...');
console.log('Project root:', projectRoot);
console.log('\nPress "a" to test the Add Task functionality');
console.log('Type some text and press Enter to submit');
console.log('Press ESC to cancel\n');

// Render the app
const { waitUntilExit } = render(<App projectRoot={projectRoot} />);

waitUntilExit().then(() => {
	console.log('\nTask Master UI test completed.');
});