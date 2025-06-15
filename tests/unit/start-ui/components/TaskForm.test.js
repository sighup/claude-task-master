/**
 * TaskForm component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import TaskForm from '../../../../scripts/modules/start-ui/components/TaskForm.jsx';
import { setupMocks } from '../setup.js';

describe.skip('TaskForm', () => {
	let mockOnSubmit;
	let mockOnCancel;

	beforeEach(() => {
		setupMocks();
		mockOnSubmit = jest.fn();
		mockOnCancel = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('rendering modes', () => {
		test('should render AI mode by default', () => {
			const { lastFrame } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Add New Task');
			expect(output).toContain('Mode:');
			expect(output).toContain('[AI-Powered (Describe');
			expect(output).toContain('Task Description:');
		});

		test('should render manual mode when selected', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Switch to manual mode (right arrow on mode selector)
			stdin.write('\x1B[C'); // Right arrow

			const output = lastFrame();
			expect(output).toContain('[Manual Entry (Fill');
			expect(output).toContain('Task Title:');
			expect(output).toContain('Description:');
		});

		test('should render simplified mode', () => {
			const { lastFrame } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					simplified={true}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Describe your task...');
			expect(output).toContain('Press Enter to submit, ESC to cancel');
			expect(output).not.toContain('Mode:');
		});

		test('should render edit mode', () => {
			const { lastFrame } = render(
				<TaskForm
					initialValues={{
						title: 'Existing task',
						description: 'Task description'
					}}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					isEdit={true}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Edit Task');
			expect(output).not.toContain('Mode:'); // No mode selector in edit
		});
	});

	describe('form navigation', () => {
		test('should navigate between fields with Tab', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Initially on mode selector
			let output = lastFrame();
			expect(output).toContain('► Mode:');

			// Tab to first field
			stdin.write('\t');
			output = lastFrame();
			expect(output).toContain('► Task Description:');

			// Tab to dependencies
			stdin.write('\t');
			output = lastFrame();
			expect(output).toContain('► Dependencies:');
		});

		test('should navigate up with up arrow', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Tab to dependencies
			stdin.write('\t');
			stdin.write('\t');

			// Go back up
			stdin.write('\x1B[A'); // Up arrow

			const output = lastFrame();
			expect(output).toContain('► Task Description:');
		});
	});

	describe('text input handling', () => {
		test('should accept text input in AI mode', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Tab to description field
			stdin.write('\t');

			// Type some text
			stdin.write('Create login page');

			const output = lastFrame();
			expect(output).toContain('Create login page');
		});

		test('should handle backspace', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Tab to description field
			stdin.write('\t');

			// Type and delete
			stdin.write('Test');
			stdin.write('\x7F'); // Backspace

			const output = lastFrame();
			expect(output).toContain('Tes');
		});
	});

	describe('priority selection', () => {
		test('should change priority with arrow keys', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Navigate to priority field
			stdin.write('\t'); // Mode
			stdin.write('\t'); // Description
			stdin.write('\t'); // Dependencies
			stdin.write('\t'); // Priority

			// Default is medium
			let output = lastFrame();
			expect(output).toContain('[medium]');

			// Left arrow to high
			stdin.write('\x1B[D');
			output = lastFrame();
			expect(output).toContain('[high]');

			// Right arrow back to medium
			stdin.write('\x1B[C');
			output = lastFrame();
			expect(output).toContain('[medium]');
		});
	});

	describe('form submission', () => {
		test('should submit form on Enter when on submit button', () => {
			const { stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Tab to description and add text
			stdin.write('\t');
			stdin.write('Test task');

			// Tab to submit button
			stdin.write('\t'); // Dependencies
			stdin.write('\t'); // Priority
			stdin.write('\t'); // Research
			stdin.write('\t'); // Submit button

			// Press Enter
			stdin.write('\r');

			expect(mockOnSubmit).toHaveBeenCalledWith({
				prompt: 'Test task',
				priority: 'medium',
				dependencies: '',
				research: false
			});
		});

		test('should not submit with empty required fields', () => {
			const { stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Navigate to submit without filling
			stdin.write('\t'); // Mode
			stdin.write('\t'); // Description (empty)
			stdin.write('\t'); // Dependencies
			stdin.write('\t'); // Priority
			stdin.write('\t'); // Research
			stdin.write('\t'); // Submit

			// Try to submit
			stdin.write('\r');

			// Should not submit
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		test('should validate dependencies format', () => {
			const { lastFrame, stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Navigate to dependencies
			stdin.write('\t'); // Mode
			stdin.write('\t'); // Description
			stdin.write('\t'); // Dependencies

			// Enter invalid dependencies
			stdin.write('abc,def');

			// Try to submit
			stdin.write('\t'); // Priority
			stdin.write('\t'); // Research
			stdin.write('\t'); // Submit
			stdin.write('\r');

			// Should show error
			const output = lastFrame();
			expect(output).toContain('Dependencies must be comma-separated task IDs');
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});
	});

	describe('cancel handling', () => {
		test('should call onCancel when ESC pressed', () => {
			const { stdin } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			// Press ESC
			stdin.write('\x1B');

			expect(mockOnCancel).toHaveBeenCalled();
		});
	});

	describe('loading state', () => {
		test('should show loading state for AI task creation', () => {
			const { lastFrame } = render(
				<TaskForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					loading={true}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Creating AI-Generated Task');
		});

		test('should show research mode in loading', () => {
			const { lastFrame } = render(
				<TaskForm
					initialValues={{ research: true, prompt: 'Test' }}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					loading={true}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Research mode enabled');
		});
	});

	describe('initial values', () => {
		test('should populate form with initial values', () => {
			const { lastFrame } = render(
				<TaskForm
					initialValues={{
						prompt: 'Initial prompt',
						priority: 'high',
						dependencies: '1,2,3'
					}}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Initial prompt');
			expect(output).toContain('[high]');
			expect(output).toContain('1,2,3');
		});

		test('should set manual mode if manual data provided', () => {
			const { lastFrame } = render(
				<TaskForm
					initialValues={{
						title: 'Manual task',
						description: 'Task description'
					}}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('[Manual Entry');
			expect(output).toContain('Manual task');
		});
	});
});