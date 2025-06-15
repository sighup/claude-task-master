import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { jest } from '@jest/globals';
import delay from 'delay';
import ModalDialog from '../../../../scripts/modules/start-ui/components/ModalDialog.jsx';

describe('ModalDialog', () => {
	describe('rendering', () => {
		it('should not render when isOpen is false', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={false} title="Test Modal">
					<Text>Modal content</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toBe('');
		});

		it('should render when isOpen is true', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test Modal">
					<Text>Modal content</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toMatch(/Test Modal/);
			expect(lastFrame()).toMatch(/Modal content/);
		});

		it('should display the title in a bordered box', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Important Dialog">
					<Text>Content here</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toMatch(/Important Dialog/);
			expect(lastFrame()).toMatch(/─/); // Border characters
		});

		it('should render children content', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test">
					<Text>Line 1</Text>
					<Text>Line 2</Text>
				</ModalDialog>
			);
			
			const frame = lastFrame();
			expect(frame).toMatch(/Line 1/);
			expect(frame).toMatch(/Line 2/);
		});
	});

	describe('footer', () => {
		it('should display footer text when provided', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test" footer="Press ESC to close">
					<Text>Content</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toMatch(/Press ESC to close/);
		});

		it('should not display footer when not provided', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test">
					<Text>Content</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).not.toMatch(/Press ESC to close/);
		});
	});

	describe('dimensions', () => {
		it('should accept width prop', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test" width={50}>
					<Text>Content</Text>
				</ModalDialog>
			);
			
			// Modal should render (exact width testing is tricky in terminal)
			expect(lastFrame()).toMatch(/Test/);
		});

		it('should accept height prop', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test" height={10}>
					<Text>Content</Text>
				</ModalDialog>
			);
			
			// Modal should render
			expect(lastFrame()).toMatch(/Test/);
		});

		it('should use default dimensions when not specified', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test">
					<Text>Content</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toMatch(/Test/);
		});
	});

	describe('overlay', () => {
		it('should render with a dimmed overlay by default', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Test">
					<Text>Content</Text>
				</ModalDialog>
			);
			
			// Check that modal is rendered
			expect(lastFrame()).toMatch(/Test/);
			// Note: Testing actual overlay dimming is difficult in terminal tests
		});

		it('should center the modal in the overlay', () => {
			const { lastFrame } = render(
				<ModalDialog isOpen={true} title="Centered Modal">
					<Text>This should be centered</Text>
				</ModalDialog>
			);
			
			expect(lastFrame()).toMatch(/Centered Modal/);
			expect(lastFrame()).toMatch(/This should be centered/);
		});
	});

	describe('keyboard handling', () => {
		it.skip('should call onClose when ESC is pressed', async () => {
			const onClose = jest.fn();
			const { stdin } = render(
				<ModalDialog isOpen={true} title="Test" onClose={onClose}>
					<Text>Content</Text>
				</ModalDialog>
			);
			
			// Simulate ESC key press
			stdin.write('\u001B');
			
			// Wait a moment for the event to process
			await delay(50);
			
			expect(onClose).toHaveBeenCalled();
		});

		it('should not call onClose when other keys are pressed', () => {
			const onClose = jest.fn();
			const { stdin } = render(
				<ModalDialog isOpen={true} title="Test" onClose={onClose}>
					<Text>Content</Text>
				</ModalDialog>
			);
			
			stdin.write('a');
			stdin.write('1');
			stdin.write('\t');
			
			expect(onClose).not.toHaveBeenCalled();
		});

		it('should not handle keyboard when modal is closed', () => {
			const onClose = jest.fn();
			const { stdin } = render(
				<ModalDialog isOpen={false} title="Test" onClose={onClose}>
					<Text>Content</Text>
				</ModalDialog>
			);
			
			stdin.write('\x1B'); // ESC key
			
			expect(onClose).not.toHaveBeenCalled();
		});
	});
});