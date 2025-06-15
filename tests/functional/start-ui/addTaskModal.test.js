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

describe('Add Task Modal', () => {
	let mockProjectRoot;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Existing task',
					status: 'pending',
					priority: 'high',
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

	it('should open add task modal when pressing a key', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'a' to add task
		stdin.write('a');
		await delay(100);

		// Should show add task modal with form
		const frame = lastFrame();
		expect(frame).toMatch(/Add New Task/);
		// Should show the AI-powered mode by default
		expect(frame).toContain('AI-Powered (Describe');
		expect(frame).toContain('Task Description:');
	});

	it('should show simple input interface', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open add task modal
		stdin.write('a');
		await delay(100);

		const frame = lastFrame();
		// Should show full task form interface
		expect(frame).toContain('Add New Task'); // Modal title
		expect(frame).toContain('Describe what needs to be done...'); // AI mode placeholder
		// Should show form fields
		expect(frame).toContain('Priority:');
		expect(frame).toContain('Dependencies:');
		expect(frame).toContain('[Add Task]'); // Submit button
	});

	it('should close modal when pressing ESC', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open add task modal
		stdin.write('a');
		await delay(100);

		// Verify modal is open
		let frame = lastFrame();
		expect(frame).toMatch(/Add New Task/);

		// Press ESC to close
		stdin.write('\x1b');
		await delay(100);

		// Should be back to task list
		frame = lastFrame();
		expect(frame).not.toMatch(/Add New Task/);
		expect(frame).toMatch(/All Tasks/);
	});

	it.skip('should add task when form is submitted', async () => {
		// Skip this test for now - needs proper task manager mocking
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Get initial task count
		const initialData = getMockTasksData(mockProjectRoot);
		const initialCount = initialData.tasks.length;

		// Open add task modal
		stdin.write('a');
		await delay(100);

		// Type task title
		stdin.write('New test task');
		await delay(50);

		// Navigate to submit button - need to go through all fields
		stdin.write('\t'); // Move to description
		await delay(50);
		stdin.write('\t'); // Move to priority
		await delay(50);
		stdin.write('\t'); // Move to dependencies
		await delay(50);
		stdin.write('\t'); // Move to submit button
		await delay(50);

		// Now press Enter to submit
		stdin.write('\r');
		await delay(200);

		// Check that modal closed
		const frame = lastFrame();
		expect(frame).not.toMatch(/Add New Task/);

		// Verify task was added
		const updatedData = getMockTasksData(mockProjectRoot);
		expect(updatedData.tasks.length).toBe(initialCount + 1);
	});

	it('should not submit with empty input', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open add task modal
		stdin.write('a');
		await delay(100);

		// Try to submit without entering anything
		stdin.write('\r');
		await delay(100);

		// Should still show modal since empty input is not allowed
		const frame = lastFrame();
		expect(frame).toMatch(/Add New Task/);
	});

	it('should show priority options and mode selector', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Open add task modal
		stdin.write('a');
		await delay(100);

		// Should show priority options in the form
		const frame = lastFrame();
		expect(frame).toContain('Priority:');
		expect(frame).toMatch(/high.*\[medium\].*low/); // medium is selected by default
		// Should show mode selector
		expect(frame).toContain('Mode:');
		expect(frame).toContain('AI-Powered');
		expect(frame).toContain('Manual Entry');
	});
});
