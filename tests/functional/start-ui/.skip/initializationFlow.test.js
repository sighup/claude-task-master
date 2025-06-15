import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Start-UI Initialization Flow', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	// Create a temporary empty directory for testing
	const createEmptyProject = () => {
		const tempDir = path.join(
			os.tmpdir(),
			`taskmaster-test-init-${Date.now()}`
		);
		fs.mkdirSync(tempDir, { recursive: true });
		return tempDir;
	};

	// Create a directory with generic project files but no Task Master
	const createGenericProject = () => {
		const tempDir = path.join(
			os.tmpdir(),
			`taskmaster-test-generic-${Date.now()}`
		);
		fs.mkdirSync(tempDir, { recursive: true });
		// Add package.json to simulate a regular project
		fs.writeFileSync(
			path.join(tempDir, 'package.json'),
			JSON.stringify({
				name: 'test-project',
				version: '1.0.0'
			})
		);
		return tempDir;
	};

	// Create a properly initialized Task Master project
	const createInitializedProject = () => {
		const tempDir = path.join(
			os.tmpdir(),
			`taskmaster-test-initialized-${Date.now()}`
		);
		fs.mkdirSync(tempDir, { recursive: true });

		// Create .taskmaster directory structure
		const taskmasterDir = path.join(tempDir, '.taskmaster');
		fs.mkdirSync(path.join(taskmasterDir, 'tasks'), { recursive: true });
		fs.mkdirSync(path.join(taskmasterDir, 'docs'), { recursive: true });

		// Create empty tasks.json
		fs.writeFileSync(
			path.join(taskmasterDir, 'tasks', 'tasks.json'),
			JSON.stringify({ tasks: [] })
		);

		// Create PRD to avoid onboarding flow
		fs.writeFileSync(
			path.join(taskmasterDir, 'docs', 'prd.txt'),
			'Test PRD document'
		);

		// Create basic config with models to avoid model selection screen
		fs.writeFileSync(
			path.join(taskmasterDir, 'config.json'),
			JSON.stringify({
				version: '1.0.0',
				models: {
					main: 'claude-3-5-sonnet',
					research: 'sonar-pro',
					fallback: 'claude-3-5-sonnet'
				}
			})
		);

		return tempDir;
	};

	// Clean up temporary directories
	const cleanupProject = (projectRoot) => {
		if (fs.existsSync(projectRoot)) {
			fs.rmSync(projectRoot, { recursive: true, force: true });
		}
	};

	afterEach(() => {
		if (app) {
			app.unmount();
		}
		if (mockProjectRoot) {
			cleanupProject(mockProjectRoot);
		}
	});

	describe('Empty Directory', () => {
		test('should show initialization prompt in completely empty directory', async () => {
			mockProjectRoot = createEmptyProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Should immediately show initialization prompt
			expect(lastFrame()).toContain('Initialize Task Master Project');
			expect(lastFrame()).not.toContain('Configure AI Models');
			expect(lastFrame()).not.toContain('No tasks found');
		});

		test('should not show model manager before initialization', async () => {
			mockProjectRoot = createEmptyProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Wait to ensure no model manager appears
			await new Promise((resolve) => setTimeout(resolve, 1000));

			expect(lastFrame()).toContain('Initialize Task Master Project');
			expect(lastFrame()).not.toContain('Model Configuration');
			expect(lastFrame()).not.toContain('Select a model');
		});
	});

	describe('Generic Project Directory', () => {
		test('should show initialization prompt in directory with package.json', async () => {
			mockProjectRoot = createGenericProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Should show initialization prompt, not task list
			expect(lastFrame()).toContain('Initialize Task Master Project');
			expect(lastFrame()).not.toContain('No tasks found');
		});
	});

	describe('Initialized Project', () => {
		test('should show task list and getting started guide after initialization', async () => {
			mockProjectRoot = createInitializedProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Wait for loading to complete
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should show empty task list
			const frame = lastFrame();
			expect(frame).toContain('No tasks to display in this view');
			expect(frame).toContain('All Tasks (0)');

			// Check status bar
			expect(frame).toContain('Total:   0');
			expect(frame).toContain('Done:  0');
			expect(frame).toContain('In Progress:  0');
			expect(frame).toContain('Pending:  0');
		});

		test('should show footer navigation even with no tasks', async () => {
			mockProjectRoot = createInitializedProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Footer should be visible with navigation commands
			const frame = lastFrame();
			expect(frame).toContain('↑/↓: Navigate');
			expect(frame).toContain('Enter: Toggle');
			expect(frame).toContain('S: Show');
			expect(frame).toContain('/: Cmd');
			expect(frame).toContain('?: Search');
			expect(frame).toContain('Q: Quit');
		});

		test('should not auto-open model manager', async () => {
			mockProjectRoot = createInitializedProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Wait to ensure model manager doesn't auto-open
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Should still show task list, not model manager
			expect(lastFrame()).toContain('No tasks found yet!');
			expect(lastFrame()).not.toContain('Model Configuration');
			expect(lastFrame()).not.toContain('Select a model');
		});

		test('should open model manager when M key is pressed', async () => {
			mockProjectRoot = createInitializedProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Wait for initial load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Press M to open model manager
			stdin.write('m');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should now show model manager
			// ModelManager uses a different title format
			const frame = lastFrame();
			expect(frame).toMatch(
				/Model.*Configuration|Configure.*Models|AI Model Management/i
			);
		});
	});

	describe('Initialization Prevention', () => {
		test('should not allow opening model manager in uninitialized project', async () => {
			mockProjectRoot = createEmptyProject();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try to press M
			stdin.write('m');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should still show initialization, not model manager
			expect(lastFrame()).toContain('Initialize Task Master Project');
			expect(lastFrame()).not.toContain('Model Configuration');
		});
	});
});
