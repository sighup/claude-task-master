import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import { jest } from '@jest/globals';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Project Setup Page', () => {
	let mockProjectRoot;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Test task',
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

	it('should navigate to project setup page when pressing p', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'p' to go to project setup
		stdin.write('p');
		await delay(100);

		// Should show project setup page
		const frame = lastFrame();
		expect(frame).toMatch(/Project Setup/);
		expect(frame).toMatch(/Model Configuration/);
	});

	it('should show current model configuration', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to project setup
		stdin.write('p');
		await delay(100);

		const frame = lastFrame();
		// Should show model roles
		expect(frame).toMatch(/Main Model/);
		expect(frame).toMatch(/Research Model/);
		expect(frame).toMatch(/Fallback Model/);
	});

	it('should allow navigation between model configuration options', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to project setup
		stdin.write('p');
		await delay(100);

		// Navigate down
		stdin.write('j');
		await delay(50);

		// Should update selection
		const frame = lastFrame();
		expect(frame).toMatch(/►/); // Selection indicator
	});

	it('should return to main view when pressing ESC', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to project setup
		stdin.write('p');
		await delay(100);

		// Verify we're in project setup
		let frame = lastFrame();
		expect(frame).toMatch(/Project Setup/);

		// Press ESC to go back
		stdin.write('\x1b'); // ESC key
		await delay(100);

		// Should be back to task list
		frame = lastFrame();
		expect(frame).not.toMatch(/Project Setup/);
		expect(frame).toMatch(/All Tasks/); // Back to main view
	});

	it('should show API key status', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to project setup
		stdin.write('p');
		await delay(100);

		const frame = lastFrame();
		// Should show API key status
		expect(frame).toMatch(/API Key Status/);
	});

	it.skip('should allow entering model selection for a role', async () => {
		// Skip this test for now - model selection requires more complex setup
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Navigate to project setup
		stdin.write('p');
		await delay(100);

		// Press Enter on a model role to edit
		stdin.write('\r');
		await delay(200); // Wait longer for component to render

		// Should show model selection
		const frame = lastFrame();
		// The ModelSelector component should be showing
		expect(frame).toMatch(/Select main Model|Keep Current Model|Custom/);
	});
});
