/**
 * Functional tests for start-ui user interactions
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData
} from './helpers/mockFileSystem.js';

describe('Start-UI User Interactions', () => {
	let mockProjectRoot;
	let app;
	let originalProcessExit;

	beforeEach(() => {
		// Mock process.exit to prevent actual exit during tests
		originalProcessExit = process.exit;
		process.exit = jest.fn();
		
		// Don't use fake timers - causes issues with delay()

		// Set up mock file system with initial tasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Implement feature A',
					description: 'Add new functionality',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 2,
					title: 'Fix bug B',
					description: 'Resolve critical issue',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 3,
					title: 'Update documentation',
					description: 'Update API docs',
					status: 'in-progress',
					priority: 'medium',
					subtasks: []
				},
				{
					id: 4,
					title: 'Code review',
					description: 'Review PRs',
					status: 'done',
					priority: 'low',
					subtasks: []
				}
			]
		});
	});

	afterEach(() => {
		if (app) {
			app.unmount();
		}
		cleanupMockProject(mockProjectRoot);
		
		// Restore process.exit
		process.exit = originalProcessExit;
	});

	test('should navigate through tasks using keyboard', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Initial state - first task should be visible
		const initialFrame = lastFrame();
		expect(initialFrame).toContain('Implement feature A');
		// The selection indicator shows task 1 is selected
		expect(initialFrame).toContain('Task 1/4'); // Status bar shows task 1 selected

		// Navigate down
		stdin.write('j');
		await delay(100);
		let frame = lastFrame();
		expect(frame).toContain('Fix bug B');
		expect(frame).toContain('Task 2/4'); // Status bar shows task 2 selected

		// Navigate down again
		stdin.write('j');
		await delay(100);
		frame = lastFrame();
		expect(frame).toContain('Update documentation');
		expect(frame).toContain('Task 3/4'); // Status bar shows task 3 selected

		// Navigate up
		stdin.write('k');
		await delay(100);
		frame = lastFrame();
		expect(frame).toContain('Fix bug B');
		expect(frame).toContain('Task 2/4'); // Back to task 2
	});

	test('should switch between view filters using number keys', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Start in 'all' view - should see all 4 tasks
		let frame = lastFrame();
		expect(frame).toContain('Implement feature A');
		expect(frame).toContain('Fix bug B');
		expect(frame).toContain('Update documentation');
		expect(frame).toContain('Code review');
		expect(frame).toContain('All Tasks (4)');

		// Switch to pending view (key '2')
		stdin.write('2');
		await delay(100);

		// Should only see pending tasks
		frame = lastFrame();
		expect(frame).toContain('Implement feature A');
		expect(frame).toContain('Fix bug B');
		expect(frame).not.toContain('Update documentation');
		expect(frame).not.toContain('Code review');
		expect(frame).toContain('Pending Tasks (2)');

		// Switch to in-progress view (key '3')
		stdin.write('3');
		await delay(100);

		frame = lastFrame();
		expect(frame).not.toContain('Implement feature A');
		expect(frame).toContain('Update documentation');
		expect(frame).toContain('In Progress Tasks (1)');

		// Switch to done view (key '4')
		stdin.write('4');
		await delay(100);

		frame = lastFrame();
		expect(frame).toContain('Code review');
		expect(frame).toContain('Completed Tasks (1)');
	});

	test('should update task status using keyboard shortcuts', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Press 's' to show task details
		stdin.write('s');
		await delay(100);

		// Should show task details
		expect(lastFrame()).toContain('Task: 1 - Implement feature A');
		expect(lastFrame()).toContain('Status: ○ pending');
		expect(lastFrame()).toContain('Suggested Actions:');
		expect(lastFrame()).toContain('[1] Mark as in-progress');

		// Press '1' to change to in-progress
		stdin.write('1');
		await delay(200);

		// Should return to list view with updated status
		let frame = lastFrame();
		expect(frame).not.toContain('Suggested Actions'); // No longer in detail view

		// Verify task status was updated in file
		const data = getMockTasksData(mockProjectRoot);
		expect(data.tasks.find((t) => t.id === 1).status).toBe('in-progress');

		// Refresh to see updated counts
		stdin.write('r');
		await delay(200);
		
		// UI should reflect the change
		frame = lastFrame();
		expect(frame).toContain('In Progress: 2'); // Was 1, now 2
	});

	test('should toggle subtasks visibility', async () => {
		// Add subtasks to a task
		const projectWithSubtasks = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Main task',
					description: 'Task with subtasks',
					status: 'in-progress',
					priority: 'high',
					subtasks: [
						{
							id: '1.1',
							title: 'Subtask 1',
							status: 'pending'
						},
						{
							id: '1.2',
							title: 'Subtask 2',
							status: 'done'
						}
					]
				}
			]
		});

		app = render(<App projectRoot={projectWithSubtasks} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Should show subtasks by default
		let frame = lastFrame();
		expect(frame).toContain('Main task');
		expect(frame).toContain('Subtask 1');
		expect(frame).toContain('Subtask 2');
		// Tree characters may vary, just check subtasks are visible

		// Press Tab to toggle subtasks
		stdin.write('\t');
		await delay(100);

		// Subtasks should be hidden
		frame = lastFrame();
		expect(frame).toContain('Main task');
		expect(frame).not.toContain('Subtask 1');
		expect(frame).not.toContain('Subtask 2');

		// Press Tab again to show subtasks
		stdin.write('\t');
		await delay(100);

		// Subtasks should be visible again
		frame = lastFrame();
		expect(frame).toContain('Subtask 1');

		cleanupMockProject(projectWithSubtasks);
	});

	test('should exit gracefully with q or ESC', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { stdin, rerender } = app;

		await delay(100);

		// Verify app is running
		expect(app.lastFrame()).toBeDefined();

		// Press 'q' to quit
		stdin.write('q');
		await delay(100);
		
		// Wait a bit for the setTimeout in handleExit to fire
		await delay(20);

		// Verify process.exit was called
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('should handle page navigation for long task lists', async () => {
		// Create project with many tasks
		const manyTasks = {
			tasks: Array.from({ length: 25 }, (_, i) => ({
				id: i + 1,
				title: `Task ${i + 1}`,
				description: `Description for task ${i + 1}`,
				status: 'pending',
				priority: 'medium',
				subtasks: []
			}))
		};

		const projectWithManyTasks = setupMockProject(manyTasks);
		app = render(<App projectRoot={projectWithManyTasks} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Should start with Task 1 in status bar
		let frame = lastFrame();
		expect(frame).toContain('Task 1/25');

		// Navigate down several times
		for (let i = 0; i < 10; i++) {
			stdin.write('j');
			await delay(50);
		}

		// Should now be at task 11
		frame = lastFrame();
		expect(frame).toContain('Task 11/25');

		// Navigate back up
		for (let i = 0; i < 10; i++) {
			stdin.write('k');
			await delay(50);
		}

		// Should be back at Task 1
		frame = lastFrame();
		expect(frame).toContain('Task 1/25');

		cleanupMockProject(projectWithManyTasks);
	});
});