import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { useInput } from 'ink';

/**
 * UpdateSubtaskPrompt - Append information to a subtask
 * Matches CLI: update-subtask --id=<parentId.subtaskId> --prompt="<context>"
 * @param {Object} props
 * @param {string} props.subtaskId - Subtask ID in format "parentId.subtaskId"
 * @param {string} props.taskTitle - Parent task title for display
 * @param {string} props.subtaskTitle - Subtask title for display
 * @param {Function} props.onSubmit - Function to call with update data
 * @param {Function} props.onCancel - Function to call on cancel
 */
const UpdateSubtaskPrompt = ({ 
	subtaskId, 
	taskTitle = '', 
	subtaskTitle = '', 
	onSubmit, 
	onCancel 
}) => {
	const [value, setValue] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}
	});

	const handleSubmit = async () => {
		if (!value.trim()) {
			setError('Please enter information to append');
			return;
		}

		setIsSubmitting(true);
		try {
			const success = await onSubmit(value.trim());
			if (!success) {
				setError('Failed to update subtask');
				setIsSubmitting(false);
			}
		} catch (err) {
			setError(err.message || 'Failed to update subtask');
			setIsSubmitting(false);
		}
	};

	if (isSubmitting) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="blue" bold>
					<Spinner type="dots" /> Updating subtask...
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text color="cyan" bold>Update Subtask</Text>
			</Box>
			
			{taskTitle && (
				<Box marginBottom={1}>
					<Text color="gray">Task: {taskTitle}</Text>
				</Box>
			)}
			
			{subtaskTitle && (
				<Box marginBottom={1}>
					<Text color="gray">Subtask: {subtaskTitle} (ID: {subtaskId})</Text>
				</Box>
			)}
			
			<Box marginBottom={1}>
				<Text>Enter information to append to this subtask:</Text>
			</Box>
			
			<Box>
				<TextInput
					value={value}
					onChange={setValue}
					onSubmit={handleSubmit}
					placeholder="e.g., Additional implementation details..."
				/>
			</Box>
			
			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}
			
			<Box marginTop={1}>
				<Text color="gray" dimColor>Press Enter to submit, ESC to cancel</Text>
			</Box>
		</Box>
	);
};

export default UpdateSubtaskPrompt;