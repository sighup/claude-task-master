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

describe('Remove Task Modal', () => {
	let mockProjectRoot;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'First task',
					description: 'This is the first task',
					status: 'pending',
					priority: 'high',
					dependencies: []
				},
				{
					id: 2,
					title: 'Second task',
					description: 'This is the second task',
					status: 'in-progress',
					priority: 'medium',
					dependencies: [1]
				},
				{
					id: 3,
					title: 'Third task',
					description: 'This is the third task',
					status: 'done',
					priority: 'low',
					dependencies: []
				}
			]
		});
	});

	afterEach(() => {
		if (mockProjectRoot) {
			cleanupMockProject(mockProjectRoot);
		}
	});

	it('should open remove task confirmation when pressing r key', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'r' to remove task
		stdin.write('r');
		await delay(100);

		// Should show remove confirmation modal
		const frame = lastFrame();
		expect(frame).toMatch(/Remove Task|Confirm Removal/);
	});

	it('should show task details in confirmation dialog', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open remove confirmation
		stdin.write('r');
		await delay(100);

		const frame = lastFrame();
		// Should show the selected task details
		expect(frame).toMatch(/First task/);
		expect(frame).toMatch(/Are you sure|confirm/i);
	});

	it('should close modal when pressing ESC', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open remove confirmation
		stdin.write('r');
		await delay(100);

		// Verify modal is open
		let frame = lastFrame();
		expect(frame).toMatch(/Remove Task|Confirm Removal/);

		// Press ESC to cancel
		stdin.write('\x1b');
		await delay(100);

		// Should be back to task list
		frame = lastFrame();
		expect(frame).not.toMatch(/Remove Task|Confirm Removal/);
		expect(frame).toMatch(/All Tasks/);
	});

	it.skip('should remove task when confirmed', async () => {
		// Skip this test for now - needs proper task manager mocking
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Get initial task count
		const initialData = getMockTasksData(mockProjectRoot);
		const initialCount = initialData.tasks.length;

		// Open remove confirmation
		stdin.write('r');
		await delay(100);

		// Confirm removal (implementation specific)
		stdin.write('y'); // or Enter if using buttons
		await delay(200);

		// Check that modal closed
		const frame = lastFrame();
		expect(frame).not.toMatch(/Remove Task|Confirm Removal/);

		// Verify task was removed
		const updatedData = getMockTasksData(mockProjectRoot);
		expect(updatedData.tasks.length).toBe(initialCount - 1);
		expect(updatedData.tasks.find((t) => t.id === 1)).toBeUndefined();
	});

	it('should handle removing task with dependencies', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to first task (which has dependents)
		// Already on first task by default

		// Open remove confirmation
		stdin.write('r');
		await delay(100);

		const frame = lastFrame();
		// Should show warning about dependencies
		expect(frame).toMatch(/dependencies|dependent tasks|warning/i);
	});

	it('should not allow removal if no tasks exist', async () => {
		// Create empty project
		const emptyProject = setupMockProject({ tasks: [] });

		try {
			const { stdin, lastFrame } = render(<App projectRoot={emptyProject} />);

			await delay(100);

			// Try to remove when no tasks
			stdin.write('r');
			await delay(100);

			// Should not show remove modal
			const frame = lastFrame();
			expect(frame).not.toMatch(/Remove Task|Confirm Removal/);
		} finally {
			cleanupMockProject(emptyProject);
		}
	});
});
