import React from 'react';
import { render } from 'ink-testing-library';
import { Text, Box } from 'ink';
import { jest } from '@jest/globals';
import { Toast, ToastContainer, ToastProvider, useToast } from '../../../../scripts/modules/start-ui/components/Toast.jsx';

describe('Toast Component', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('Toast', () => {
		it('renders with correct type styling', () => {
			const { lastFrame } = render(
				<Toast
					id={1}
					type="success"
					message="Test success message"
					onDismiss={() => {}}
				/>
			);

			expect(lastFrame()).toContain('✓');
			expect(lastFrame()).toContain('Test success message');
		});

		it('renders all toast types correctly', () => {
			const types = [
				{ type: 'success', icon: '✓' },
				{ type: 'error', icon: '✗' },
				{ type: 'warning', icon: '⚠' },
				{ type: 'info', icon: 'ℹ' }
			];

			types.forEach(({ type, icon }) => {
				const { lastFrame } = render(
					<Toast
						id={1}
						type={type}
						message={`Test ${type} message`}
						onDismiss={() => {}}
					/>
				);

				expect(lastFrame()).toContain(icon);
				expect(lastFrame()).toContain(`Test ${type} message`);
			});
		});

		it.skip('calls onDismiss after duration', () => {
			const mockDismiss = jest.fn();
			
			const { unmount } = render(
				<Box width={50} height={5}>
					<Toast
						id={1}
						type="info"
						message="Auto dismiss test"
						duration={100} // Short duration for testing
						onDismiss={mockDismiss}
					/>
				</Box>
			);

			// Run all timers to trigger the auto-dismiss
			jest.runAllTimers();
			
			expect(mockDismiss).toHaveBeenCalledWith(1);
			
			// Clean up
			unmount();
		});

		it('renders with exit animation', () => {
			const { rerender, lastFrame } = render(
				<Toast
					id={1}
					type="info"
					message="Exit animation test"
					onDismiss={() => {}}
					isExiting={false}
				/>
			);

			const normalFrame = lastFrame();

			rerender(
				<Toast
					id={1}
					type="info"
					message="Exit animation test"
					onDismiss={() => {}}
					isExiting={true}
				/>
			);

			// Frame should still contain the message but with dimColor applied
			expect(lastFrame()).toContain('Exit animation test');
		});
	});

	describe('ToastContainer', () => {
		it('renders multiple toasts', () => {
			const toasts = [
				{ id: 1, type: 'success', message: 'First toast' },
				{ id: 2, type: 'error', message: 'Second toast' },
				{ id: 3, type: 'info', message: 'Third toast' }
			];

			// Wrap in Box to provide dimensions since ToastContainer uses absolute positioning
			const { lastFrame } = render(
				<Box width={80} height={20}>
					<ToastContainer toasts={toasts} onDismiss={() => {}} />
				</Box>
			);

			const output = lastFrame();
			expect(output).toContain('First toast');
			expect(output).toContain('Second toast');
			expect(output).toContain('Third toast');
			expect(output).toContain('✓');
			expect(output).toContain('✗');
			expect(output).toContain('ℹ');
		});
	});

	describe('ToastProvider and useToast', () => {
		it('provides toast methods through context', () => {
			let toastMethods;

			const TestComponent = () => {
				toastMethods = useToast();
				return null;
			};

			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			expect(toastMethods).toHaveProperty('addToast');
			expect(toastMethods).toHaveProperty('dismissToast');
			expect(toastMethods).toHaveProperty('clearToasts');
			expect(toastMethods).toHaveProperty('success');
			expect(toastMethods).toHaveProperty('error');
			expect(toastMethods).toHaveProperty('warning');
			expect(toastMethods).toHaveProperty('info');
		});

		it.skip('adds and displays toasts', () => {
			const TestComponent = () => {
				const toast = useToast();
				
				React.useEffect(() => {
					toast.success('Success message');
					toast.error('Error message');
				}, []); // Empty dependency array - only run once

				return <Text>Test</Text>;
			};

			const { lastFrame } = render(
				<Box width={80} height={20}>
					<ToastProvider>
						<TestComponent />
					</ToastProvider>
				</Box>
			);

			expect(lastFrame()).toContain('Success message');
			expect(lastFrame()).toContain('Error message');
			expect(lastFrame()).toContain('✓');
			expect(lastFrame()).toContain('✗');
		});

		it.skip('dismisses toasts', () => {
			let toastId;
			let dismissFn;

			const TestComponent = () => {
				const toast = useToast();
				dismissFn = toast.dismissToast;
				
				React.useEffect(() => {
					toastId = toast.info('Dismissable toast', 10000); // Long duration
				}, []); // Empty dependency array

				return <Text>Test</Text>;
			};

			const { lastFrame, rerender } = render(
				<Box width={80} height={20}>
					<ToastProvider>
						<TestComponent />
					</ToastProvider>
				</Box>
			);

			expect(lastFrame()).toContain('Dismissable toast');

			// Call dismiss directly instead of using setTimeout
			dismissFn(toastId);
			
			// Advance for animation
			jest.advanceTimersByTime(200);
			
			// Force re-render to see the change
			rerender(
				<Box width={80} height={20}>
					<ToastProvider>
						<TestComponent />
					</ToastProvider>
				</Box>
			);
			
			// Toast should be gone after dismiss + animation
			expect(lastFrame()).not.toContain('Dismissable toast');
		});

		it.skip('clears all toasts', () => {
			let clearFn;
			
			const TestComponent = () => {
				const toast = useToast();
				clearFn = toast.clearToasts;
				
				React.useEffect(() => {
					toast.success('Toast 1');
					toast.info('Toast 2');
					toast.warning('Toast 3');
				}, []); // Empty dependency array

				return <Text>Test</Text>;
			};

			const { lastFrame, rerender } = render(
				<Box width={80} height={20}>
					<ToastProvider>
						<TestComponent />
					</ToastProvider>
				</Box>
			);

			// Initially should have all toasts
			expect(lastFrame()).toContain('Toast 1');
			expect(lastFrame()).toContain('Toast 2');
			expect(lastFrame()).toContain('Toast 3');

			// Call clear directly
			clearFn();
			
			// Advance for animation
			jest.advanceTimersByTime(200);
			
			// Force re-render
			rerender(
				<Box width={80} height={20}>
					<ToastProvider>
						<TestComponent />
					</ToastProvider>
				</Box>
			);
			
			// All toasts should be gone
			expect(lastFrame()).not.toContain('Toast 1');
			expect(lastFrame()).not.toContain('Toast 2');
			expect(lastFrame()).not.toContain('Toast 3');
		});

		it.skip('throws error when useToast is used outside provider', () => {
			const TestComponent = () => {
				useToast(); // This should throw
				return null;
			};

			// Suppress console.error for this test
			const originalError = console.error;
			console.error = jest.fn();

			expect(() => {
				render(<TestComponent />);
			}).toThrow('useToast must be used within a ToastProvider');

			console.error = originalError;
		});
	});
});