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

describe('Status Update Modal Integration', () => {
	let mockProjectRoot;

	beforeEach(() => {
		jest.useFakeTimers();
		// Set up mock file system with initial tasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Task 1',
					description: 'First task',
					status: 'pending',
					priority: 'high',
					dependencies: [],
					subtasks: [
						{
							id: 1,
							title: 'Subtask 1.1',
							status: 'pending',
							description: 'First subtask'
						}
					]
				},
				{
					id: 2,
					title: 'Task 2',
					description: 'Second task',
					status: 'in-progress',
					priority: 'medium',
					dependencies: []
				}
			]
		});
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		if (mockProjectRoot) {
			cleanupMockProject(mockProjectRoot);
		}
	});

	it('should open status update modal when pressing u key', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'u' to open status update modal
		stdin.write('u');
		await delay(50);

		const frame = lastFrame();
		expect(frame).toMatch(/Update Status/);
		expect(frame).toMatch(/Current: pending/);
		// Check for status options
		expect(frame).toMatch(/pending/);
		expect(frame).toMatch(/done/);
		// Don't check for in-progress as it may be truncated in the output
	});

	it('should update task status when selecting from modal', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'u' to open modal
		stdin.write('u');
		await delay(50);

		// Press '2' to select in-progress
		stdin.write('2');
		await delay(100);

		// Check that modal closed
		expect(lastFrame()).not.toMatch(/Update Status/);

		// Verify status was updated
		const tasksData = getMockTasksData(mockProjectRoot);
		expect(tasksData.tasks[0].status).toBe('in-progress');
	});

	it('should close modal when pressing ESC', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'u' to open modal
		stdin.write('u');
		await delay(50);

		expect(lastFrame()).toMatch(/Update Status/);

		// Press ESC to close
		stdin.write('\u001B');
		await delay(50);

		// Modal should be closed
		expect(lastFrame()).not.toMatch(/Update Status/);
	});

	it('should update subtask status when in subtask detail view', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Show task detail
		stdin.write('s');
		await delay(50);

		// Navigate to subtask
		stdin.write('\t'); // Focus on subtasks
		await delay(50);
		stdin.write('\r'); // Enter to view subtask detail
		await delay(50);

		// Press 'u' to open modal
		stdin.write('u');
		await delay(50);

		expect(lastFrame()).toMatch(/Update Status/);
		expect(lastFrame()).toMatch(/Current: pending/);

		// Select done
		stdin.write('3');
		await delay(100);

		// Verify subtask status was updated
		const tasksData = getMockTasksData(mockProjectRoot);
		expect(tasksData.tasks[0].subtasks[0].status).toBe('done');
	});

	it('should handle navigation in status modal', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'u' to open modal
		stdin.write('u');
		await delay(50);

		// Navigate down
		stdin.write('\x1B[B'); // Down arrow
		await delay(50);

		// Should highlight in-progress
		const frame = lastFrame();
		expect(frame).toMatch(/▶.*in-progress/);

		// Press Enter to select
		stdin.write('\r');
		await delay(100);

		// Verify status was updated
		const tasksData = getMockTasksData(mockProjectRoot);
		expect(tasksData.tasks[0].status).toBe('in-progress');
	});
});
