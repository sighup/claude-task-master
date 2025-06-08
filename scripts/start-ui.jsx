#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './modules/start-ui/App.jsx';
import { findProjectRoot } from './modules/utils.js';

const projectRoot = findProjectRoot();
if (!projectRoot) {
	console.error('Error: Not in a task-master project directory');
	console.error('Run "task-master init" to initialize a new project');
	process.exit(1);
}

// Check if we have a proper TTY for interactive input
if (!process.stdin.isTTY) {
	console.error('\nInteractive mode is not supported in this environment.');
	console.error('A TTY (terminal) is required for keyboard input.');
	console.error('\nPlease use the regular CLI commands instead:');
	console.error('  task-master list        # View tasks');
	console.error('  task-master next-task   # Get next task');
	console.error('  task-master set-status <id> <status>  # Update task status');
	console.error('\nFor more commands, run: task-master --help');
	process.exit(1);
}

try {
	const { waitUntilExit } = render(<App projectRoot={projectRoot} />);
	await waitUntilExit();
} catch (error) {
	console.error('Error starting Ink UI:', error.message);

	// If it's a raw mode error, provide helpful guidance
	if (error.message.includes('Raw mode is not supported')) {
		console.error(
			'\nThis environment does not support interactive terminal input.'
		);
		console.error('Please use the regular CLI commands instead:');
		console.error('  task-master list        # View tasks');
		console.error('  task-master next-task   # Get next task');
		console.error(
			'  task-master set-status <id> <status>  # Update task status'
		);
	}

	process.exit(1);
}
