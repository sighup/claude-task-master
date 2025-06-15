import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import Spinner from 'ink-spinner';

/**
 * RemoveSubtaskDialog - Remove a subtask with optional conversion to standalone task
 * Matches CLI: remove-subtask --parent-id=<id> --subtask-id=<id> --convert
 * @param {Object} props
 * @param {string} props.parentTaskId - Parent task ID
 * @param {string} props.parentTaskTitle - Parent task title
 * @param {string} props.subtaskId - Subtask ID (e.g., "5.1")
 * @param {string} props.subtaskTitle - Subtask title
 * @param {Function} props.onConfirm - Function to call on confirmation
 * @param {Function} props.onCancel - Function to call on cancel
 */
const RemoveSubtaskDialog = ({ 
	parentTaskId,
	parentTaskTitle,
	subtaskId,
	subtaskTitle,
	onConfirm, 
	onCancel 
}) => {
	const [convertToTask, setConvertToTask] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState(null);

	useInput((input, key) => {
		if (isProcessing) return;

		if (key.escape) {
			onCancel();
			return;
		}

		// Toggle convert option with space
		if (input === ' ' || key.space) {
			setConvertToTask(!convertToTask);
			return;
		}

		// Confirm with y/Y or Enter
		if (input === 'y' || input === 'Y' || key.return) {
			handleConfirm();
			return;
		}

		// Cancel with n/N
		if (input === 'n' || input === 'N') {
			onCancel();
			return;
		}
	});

	const handleConfirm = async () => {
		setIsProcessing(true);
		try {
			const success = await onConfirm(convertToTask);
			if (!success) {
				setError('Failed to remove subtask');
				setIsProcessing(false);
			}
		} catch (err) {
			setError(err.message || 'Failed to remove subtask');
			setIsProcessing(false);
		}
	};

	if (isProcessing) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="blue" bold>
					<Spinner type="dots" /> {convertToTask ? 'Converting subtask to task...' : 'Removing subtask...'}
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Context */}
			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text color="cyan" bold>Parent Task: </Text>
					<Text color="white">{parentTaskTitle}</Text>
				</Box>
				<Box>
					<Text color="yellow" bold>Removing Subtask: </Text>
					<Text color="white">{subtaskTitle}</Text>
					<Text color="gray"> (ID: {subtaskId})</Text>
				</Box>
			</Box>

			{/* Options */}
			<Box marginBottom={1} flexDirection="column">
				<Text color="white" bold>Options:</Text>
				<Box marginLeft={2}>
					<Text color="white">[</Text>
					<Text color={convertToTask ? 'green' : 'gray'}>
						{convertToTask ? '✓' : ' '}
					</Text>
					<Text color="white">] Convert to standalone task</Text>
					<Text color="gray"> (press Space to toggle)</Text>
				</Box>
			</Box>

			{/* Warning */}
			{!convertToTask && (
				<Box marginBottom={1}>
					<Text color="yellow">⚠️  This will permanently delete the subtask!</Text>
				</Box>
			)}

			{/* Confirmation */}
			<Box>
				<Text color="white">
					{convertToTask 
						? 'Convert this subtask to a standalone task?' 
						: 'Remove this subtask permanently?'} 
				</Text>
				<Text color="gray"> [Y/n] </Text>
			</Box>

			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Y/Enter: Confirm | N: Cancel | Space: Toggle convert | ESC: Cancel
				</Text>
			</Box>
		</Box>
	);
};

export default RemoveSubtaskDialog;