import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import Spinner from 'ink-spinner';

/**
 * ClearSubtasksDialog - Clear all subtasks from tasks
 * Matches CLI: clear-subtasks --all or clear-subtasks --id=<ids>
 * @param {Object} props
 * @param {Array} props.tasks - Array of all tasks
 * @param {Function} props.onConfirm - Function to call on confirmation
 * @param {Function} props.onCancel - Function to call on cancel
 */
const ClearSubtasksDialog = ({ 
	tasks,
	onConfirm, 
	onCancel 
}) => {
	const [clearMode, setClearMode] = useState('all'); // 'all' or 'selected'
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState(null);

	// Calculate tasks with subtasks
	const tasksWithSubtasks = tasks.filter(t => t.subtasks && t.subtasks.length > 0);
	const totalSubtasks = tasksWithSubtasks.reduce((sum, t) => sum + t.subtasks.length, 0);

	useInput((input, key) => {
		if (isProcessing) return;

		if (key.escape) {
			onCancel();
			return;
		}

		// Toggle mode with Tab
		if (key.tab) {
			setClearMode(clearMode === 'all' ? 'selected' : 'all');
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
			// For now, we'll clear all subtasks
			// Future enhancement: allow selecting specific tasks
			const success = await onConfirm(true); // true = all tasks
			if (!success) {
				setError('Failed to clear subtasks');
				setIsProcessing(false);
			}
		} catch (err) {
			setError(err.message || 'Failed to clear subtasks');
			setIsProcessing(false);
		}
	};

	if (isProcessing) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="blue" bold>
					<Spinner type="dots" /> Clearing subtasks...
				</Text>
			</Box>
		);
	}

	if (tasksWithSubtasks.length === 0) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="yellow">No tasks have subtasks to clear.</Text>
				<Box marginTop={1}>
					<Text color="gray" dimColor>Press any key to close</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Summary */}
			<Box marginBottom={1} flexDirection="column">
				<Text color="white" bold>Clear Subtasks Summary:</Text>
				<Box marginLeft={2} marginTop={1} flexDirection="column">
					<Text color="gray">
						Tasks with subtasks: <Text color="cyan">{tasksWithSubtasks.length}</Text>
					</Text>
					<Text color="gray">
						Total subtasks: <Text color="cyan">{totalSubtasks}</Text>
					</Text>
				</Box>
			</Box>

			{/* Mode Selection (for future enhancement) */}
			{/* Currently always clears all, but structure allows for future selected mode */}
			<Box marginBottom={1} flexDirection="column">
				<Text color="white" bold>Clear Mode:</Text>
				<Box marginLeft={2}>
					<Text color={clearMode === 'all' ? 'green' : 'gray'}>
						[{clearMode === 'all' ? '●' : '○'}] Clear all subtasks from all tasks
					</Text>
				</Box>
			</Box>

			{/* Warning */}
			<Box marginBottom={1}>
				<Text color="yellow">
					⚠️  This will permanently remove {totalSubtasks} subtask{totalSubtasks > 1 ? 's' : ''} from {tasksWithSubtasks.length} task{tasksWithSubtasks.length > 1 ? 's' : ''}!
				</Text>
			</Box>

			{/* Confirmation */}
			<Box>
				<Text color="white">Clear all subtasks? </Text>
				<Text color="gray">[Y/n] </Text>
			</Box>

			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Y/Enter: Confirm | N/ESC: Cancel
				</Text>
			</Box>
		</Box>
	);
};

export default ClearSubtasksDialog;