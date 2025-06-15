import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import { jest } from '@jest/globals';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData
} from './helpers/mockFileSystem.js';

describe('Update Task Modal', () => {
	let mockProjectRoot;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'First task',
					description: 'Original description',
					status: 'pending',
					priority: 'high',
					dependencies: []
				},
				{
					id: 2,
					title: 'Second task',
					description: 'Another task',
					status: 'in-progress',
					priority: 'medium',
					dependencies: [1]
				}
			]
		});
	});

	afterEach(() => {
		if (mockProjectRoot) {
			cleanupMockProject(mockProjectRoot);
		}
	});

	it('should open update task modal when pressing e key', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		// Should show update task modal
		const frame = lastFrame();
		expect(frame).toMatch(/Update Task/); // Modal title
		expect(frame).toContain('Enter new context to update this task'); // Prompt text
	});

	it('should show current task info in update modal', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		const frame = lastFrame();
		// Should show current task being updated
		expect(frame).toContain('Updating:');
		expect(frame).toContain('First task');
		expect(frame).toContain('ID: 1');
		expect(frame).toContain('Enter new context to update this task');
	});

	it('should close modal when pressing ESC', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		// Verify modal is open
		let frame = lastFrame();
		expect(frame).toMatch(/Update Task/);

		// Press ESC to close
		stdin.write('\x1b');
		await delay(100);

		// Should be back to task list
		frame = lastFrame();
		expect(frame).not.toMatch(/Update Task/);
		expect(frame).toMatch(/All Tasks/);
	});

	it('should update selected task', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to second task
		stdin.write('j');
		await delay(100);

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		// Should show second task info
		const frame = lastFrame();
		expect(frame).toContain('Task 2: Second task');

		// Type update text
		stdin.write('Updated task content');
		await delay(50);

		// Submit update (Enter)
		stdin.write('\r');
		await delay(200);

		// Should return to task list
		expect(lastFrame()).not.toMatch(/Update Task/);

		// Note: The actual task update happens through the task manager service
		// The test verifies the UI flow works correctly
	});

	it('should handle empty update gracefully', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		// Try to submit without entering anything
		stdin.write('\r');
		await delay(100);

		// Should still show modal (empty input not allowed)
		const frame = lastFrame();
		expect(frame).toMatch(/Update Task/);
	});

	it('should update task from different views', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Switch to in-progress view
		stdin.write('3');
		await delay(100);

		// Should only see task 2
		expect(lastFrame()).toContain('Second task');

		// Open command palette and use update-task command
		stdin.write('/');
		await delay(50);
		stdin.write('update-task');
		await delay(50);
		stdin.write('\r');
		await delay(100);

		// Should show task 2 for update
		const frame = lastFrame();
		expect(frame).toContain('Updating:');
		expect(frame).toContain('Second task');
		expect(frame).toContain('ID: 2');
	});
});
