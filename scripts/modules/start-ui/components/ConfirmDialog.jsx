import React from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Confirmation dialog component for yes/no prompts
 * @param {Object} props - Component props
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} [props.details] - Optional detailed information
 * @param {string} [props.confirmText='Yes'] - Text for confirm button
 * @param {string} [props.cancelText='No'] - Text for cancel button
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {string} [props.warning] - Optional warning message
 * @returns {React.Component} The confirmation dialog component
 */
export default function ConfirmDialog({
	title,
	message,
	details,
	confirmText = 'Yes',
	cancelText = 'No',
	onConfirm,
	onCancel,
	warning
}) {
	const [selectedOption, setSelectedOption] = React.useState(1); // Default to "No" for safety

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		if (key.leftArrow || key.rightArrow) {
			setSelectedOption(prev => prev === 0 ? 1 : 0);
			return;
		}

		if (key.return) {
			if (selectedOption === 0) {
				onConfirm();
			} else {
				onCancel();
			}
			return;
		}

		// Y/N shortcuts
		if (input === 'y' || input === 'Y') {
			onConfirm();
			return;
		}

		if (input === 'n' || input === 'N') {
			onCancel();
			return;
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text color="yellow" bold>{title}</Text>
			</Box>
			
			<Box marginBottom={1}>
				<Text>{message}</Text>
			</Box>

			{details && (
				<Box marginBottom={1}>
					<Text color="gray">{details}</Text>
				</Box>
			)}

			{warning && (
				<Box marginBottom={1}>
					<Text color="red" bold>⚠ Warning: {warning}</Text>
				</Box>
			)}

			<Box marginTop={1} flexDirection="row">
				<Box marginRight={2}>
					<Text
						color={selectedOption === 0 ? 'green' : 'gray'}
						bold={selectedOption === 0}
					>
						{selectedOption === 0 ? '► ' : '  '}
						[Y] {confirmText}
					</Text>
				</Box>
				<Box>
					<Text
						color={selectedOption === 1 ? 'red' : 'gray'}
						bold={selectedOption === 1}
					>
						{selectedOption === 1 ? '► ' : '  '}
						[N] {cancelText}
					</Text>
				</Box>
			</Box>

			<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
				<Text color="gray">
					←→: Select | Enter: Confirm | Y/N: Quick select | ESC: Cancel
				</Text>
			</Box>
		</Box>
	);
}