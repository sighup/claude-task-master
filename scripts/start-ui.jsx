#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';

// Load .env from current working directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Debug: Check if API keys are loaded
if (process.env.NODE_ENV !== 'production') {
	const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
	const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
	if (!hasAnthropicKey && !hasPerplexityKey) {
		console.warn(chalk.yellow('Warning: No API keys found in environment. Make sure your .env file is in the project root.'));
	} else {
		console.log(chalk.green('✓ API keys loaded from environment:'));
		if (hasAnthropicKey) console.log(chalk.gray('  - ANTHROPIC_API_KEY found'));
		if (hasPerplexityKey) console.log(chalk.gray('  - PERPLEXITY_API_KEY found'));
	}
}

// Early TTY guard – avoid loading Ink in non-interactive environments to prevent raw-mode errors
if (!process.stdin.isTTY) {
  console.error(
		chalk.red('Error: Task Master UI must be run in a TTY (interactive terminal).') +
			'\n' +
			chalk.yellow(
				'If you are in a CI environment or non-interactive shell, use non-interactive commands instead (e.g., `task-master list`).'
			)
	);
  process.exit(1);
}

// Only import heavy Ink/React modules when we know we are in an interactive TTY
import React from 'react';
import { render } from 'ink';
import App from './modules/start-ui/App.jsx';

// Get project root from command line arguments or use current working directory
const projectRoot = process.cwd();

try {
	const { waitUntilExit } = render(
    <App projectRoot={projectRoot} />
  );
  // console.log('--- Ink App rendered, waiting for exit ---'); // Original log
	await waitUntilExit();
} catch (error) {
  console.error('Error starting Ink UI:', error);

  // Check for common raw mode errors and provide helpful messages
  if (error.message.includes('setRawMode')) {
    console.error(
      chalk.yellow(
        'This often means the terminal is not interactive (e.g., in a CI environment or script output pipe).'      )
    );
    console.error(
      chalk.cyan(
        'Try running non-interactive commands like `task-master list` or ensure you are in a fully interactive terminal.'
      )
    );
  }
  // process.exit(1); // We'll let the parent process decide to exit based on child's exit code
}

