/**
 * Functional tests for updating task status through the UI
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

describe('Start-UI Task Status Updates', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Update me',
					description: 'Task to be updated',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 2,
					title: 'Another task',
					description: 'Secondary task',
					status: 'pending',
					priority: 'medium',
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
	});

	test('should update task status through UI interaction', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Verify initial state
		expect(lastFrame()).toContain('Pending: 2');
		expect(lastFrame()).toContain('In Progress: 0');

		// Press 's' to show task details
		stdin.write('s');
		await delay(200);

		// Should see the ShowTask view with suggested actions
		expect(lastFrame()).toContain('Suggested Actions:');
		expect(lastFrame()).toContain('[1] Mark as in-progress');
		expect(lastFrame()).toContain('[2] Mark as done');

		// Press '1' to change to in-progress
		stdin.write('1');
		await delay(200);

		// Should return to list view
		expect(lastFrame()).not.toContain('Suggested Actions');

		// Manual refresh to ensure we see the update
		stdin.write('r');
		await delay(200);

		// Verify UI shows updated status
		const frame = lastFrame();
		expect(frame).toContain('Pending: 1');
		expect(frame).toContain('In Progress: 1');

		// Verify file was actually updated
		const fileData = getMockTasksData(mockProjectRoot);
		expect(fileData.tasks.find(t => t.id === 1).status).toBe('in-progress');
	});

	test('should update multiple tasks through UI', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Update first task to in-progress
		stdin.write('s'); // Show task details
		await delay(100);
		stdin.write('1'); // Mark as in-progress
		await delay(200);

		// Navigate to second task
		stdin.write('j'); // Down
		await delay(100);

		// Update second task to done
		stdin.write('s'); // Show task details
		await delay(100);
		stdin.write('2'); // Mark as done
		await delay(200);

		// Refresh to see all changes
		stdin.write('r');
		await delay(200);

		// Verify both updates
		const frame = lastFrame();
		expect(frame).toContain('Pending: 0');
		expect(frame).toContain('In Progress: 1');
		expect(frame).toContain('Done: 1');
	});

	test('should show updated task in filtered views', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Update first task to done
		stdin.write('s'); // Show task details
		await delay(100);
		stdin.write('2'); // Mark as done
		await delay(200);

		// Switch to done view
		stdin.write('4');
		await delay(100);

		// Refresh
		stdin.write('r');
		await delay(200);

		// Should see the task in done view
		expect(lastFrame()).toContain('Update me');
		expect(lastFrame()).toContain('Completed Tasks (1)');

		// Switch to pending view
		stdin.write('2');
		await delay(100);

		// Should only see the other task
		expect(lastFrame()).toContain('Another task');
		expect(lastFrame()).not.toContain('Update me');
	});

	test('should handle escape from task detail view', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Enter task detail
		stdin.write('s'); // Show task details
		await delay(100);

		// Should be in detail view
		expect(lastFrame()).toContain('Suggested Actions:');
		expect(lastFrame()).toContain('[1] Mark as in-progress');

		// Press Escape
		stdin.write('\u001B'); // ESC
		await delay(100);

		// Should return to list view
		expect(lastFrame()).not.toContain('Suggested Actions');
		expect(lastFrame()).toContain('All Tasks (2)');
	});
});