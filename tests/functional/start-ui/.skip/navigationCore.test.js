import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Core Navigation Tests', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	const sampleTasks = {
		tasks: [
			{
				id: 1,
				title: 'Setup development environment',
				description: 'Install necessary tools and dependencies',
				status: 'pending',
				priority: 'high'
			},
			{
				id: 2,
				title: 'Create user authentication',
				description: 'Implement login and registration',
				status: 'in-progress',
				priority: 'high',
				subtasks: [
					{
						id: '2.1',
						title: 'Design auth schema',
						status: 'done'
					},
					{
						id: '2.2',
						title: 'Implement JWT tokens',
						status: 'pending'
					}
				]
			},
			{
				id: 3,
				title: 'Design database schema',
				description: 'Create ERD and implement models',
				status: 'done',
				priority: 'medium'
			},
			{
				id: 4,
				title: 'Write unit tests',
				description: 'Add comprehensive test coverage',
				status: 'review',
				priority: 'medium'
			}
		]
	};

	beforeEach(async () => {
		mockProjectRoot = setupMockProject(sampleTasks);
		app = render(<App projectRoot={mockProjectRoot} />);
		({ stdin, lastFrame } = app);

		// Wait for app to fully initialize
		await new Promise((resolve) => setTimeout(resolve, 1000));
	});

	afterEach(() => {
		app.unmount();
		cleanupMockProject(mockProjectRoot);
	});

	describe('View Switching (1-4 keys)', () => {
		test('should switch to All Tasks view (1)', async () => {
			// Should already be on All Tasks view by default
			const frame = lastFrame();
			expect(frame).toContain('All Tasks');
			expect(frame).toContain('Setup development environment');
			expect(frame).toContain('Create user authentication');
			expect(frame).toContain('Design database schema');
			expect(frame).toContain('Write unit tests');
		});

		test('should switch to Pending view (2)', async () => {
			// Now switch to pending view
			await stdin.write('2');

			// Wait for state update and re-render
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			expect(frame).toContain('Pending Tasks');
			expect(frame).toContain('Setup development environment');
			expect(frame).not.toContain('Design database schema'); // done task
		});

		test('should switch to In Progress view (3)', async () => {
			await stdin.write('3');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			expect(frame).toContain('In Progress Tasks');
			expect(frame).toContain('Create user authentication');
			expect(frame).not.toContain('Setup development environment'); // pending task
		});

		test('should switch to Done view (4)', async () => {
			await stdin.write('4');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			expect(frame).toContain('Completed Tasks');
			expect(frame).toContain('Design database schema');
			expect(frame).not.toContain('Setup development environment'); // pending task
		});
	});

	describe('J/K Navigation', () => {
		test('should navigate down with j key', async () => {
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should have moved selection down
			// Look for selection indicators (typically > or colored text)
			expect(frame).toMatch(/[>▶].*Create user authentication/);
		});

		test('should navigate up with k key', async () => {
			// First go down twice
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Then go up
			await stdin.write('k');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toMatch(/[>▶].*Create user authentication/);
		});

		test('should wrap around at boundaries', async () => {
			// Go up from first item
			await stdin.write('k');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should wrap to last item
			expect(frame).toMatch(/[>▶].*Write unit tests/);
		});
	});

	describe('Page Up/Down Navigation', () => {
		test('should page down with PageDown', async () => {
			// Create a project with many tasks
			const manyTasks = {
				tasks: Array.from({ length: 20 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					description: `Description for task ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			cleanupMockProject(mockProjectRoot);
			mockProjectRoot = setupMockProject(manyTasks);
			app.unmount();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			await stdin.write('\u001b[6~'); // PageDown
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should have scrolled down
			expect(frame).not.toContain('Task 1');
			expect(frame).toContain('Task 10');
		});

		test('should page up with PageUp', async () => {
			// Create a project with many tasks
			const manyTasks = {
				tasks: Array.from({ length: 20 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					description: `Description for task ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			cleanupMockProject(mockProjectRoot);
			mockProjectRoot = setupMockProject(manyTasks);
			app.unmount();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// First go to end
			for (let i = 0; i < 20; i++) {
				await stdin.write('j');
			}
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then page up
			await stdin.write('\u001b[5~'); // PageUp
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should have scrolled up
			expect(frame).toContain('Task 1');
		});
	});

	describe('ESC Key Behavior', () => {
		test('should exit app from main view', async () => {
			const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

			await stdin.write('\u001b'); // ESC
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(exitMock).toHaveBeenCalledWith(0);
			exitMock.mockRestore();
		});

		test('should close modal and return to list', async () => {
			// Open add task modal
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			let frame = lastFrame();
			expect(frame).toContain('Add New Task');

			// Press ESC
			await stdin.write('\u001b'); // ESC
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).not.toContain('Add New Task');
			expect(frame).toContain('All Tasks');
		});

		test('should go back from task detail view', async () => {
			// Enter task detail view
			await stdin.write('\r'); // Enter
			await new Promise((resolve) => setTimeout(resolve, 100));

			let frame = lastFrame();
			expect(frame).toContain('Task Details');

			// Press ESC
			await stdin.write('\u001b'); // ESC
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).not.toContain('Task Details');
			expect(frame).toContain('All Tasks');
		});
	});

	describe('Tab Navigation', () => {
		test('should cycle through form fields in modals', async () => {
			// Open add task modal
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Tab through fields
			await stdin.write('\t');
			await new Promise((resolve) => setTimeout(resolve, 50));
			await stdin.write('\t');
			await new Promise((resolve) => setTimeout(resolve, 50));

			const frame = lastFrame();
			// Should show focus on different fields
			expect(frame).toContain('Title');
			expect(frame).toContain('Description');
			expect(frame).toContain('Priority');
		});

		test('should activate action bar with tab', async () => {
			await stdin.write('\t');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Action bar should be active (visual indicator)
			// This would depend on implementation but typically shows highlighting
			expect(frame).toMatch(/\[.*\]/); // Commands in brackets
		});
	});

	describe('Enter Key Navigation', () => {
		test('should open task details on Enter', async () => {
			await stdin.write('\r'); // Enter
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Task Details');
			expect(frame).toContain('Setup development environment');
			expect(frame).toContain('Install necessary tools and dependencies');
		});

		test('should navigate to subtask details', async () => {
			// Go to second task (has subtasks)
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Subtasks');
			expect(frame).toContain('Design auth schema');
			expect(frame).toContain('Implement JWT tokens');
		});
	});

	describe('Subtask Toggle (s key)', () => {
		test('should toggle subtask visibility', async () => {
			// Initially subtasks should not be visible in list
			let frame = lastFrame();
			expect(frame).not.toContain('Design auth schema');

			// Toggle subtasks
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).toContain('Design auth schema');
			expect(frame).toContain('Implement JWT tokens');

			// Toggle again to hide
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).not.toContain('Design auth schema');
		});
	});

	describe('Help Screen (h key)', () => {
		test('should show help overlay', async () => {
			await stdin.write('h');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Keyboard Shortcuts');
			expect(frame).toContain('Navigation');
			expect(frame).toContain('j/k');
			expect(frame).toContain('Task Management');
			expect(frame).toContain('Add task');
		});

		test('should close help with ESC', async () => {
			await stdin.write('h');
			await new Promise((resolve) => setTimeout(resolve, 50));

			await stdin.write('\u001b'); // ESC
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).not.toContain('Keyboard Shortcuts');
			expect(frame).toContain('All Tasks');
		});
	});
});
