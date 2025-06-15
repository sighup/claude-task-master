import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';

/**
 * UpdatePromptEnhanced - A single prompt input for updating tasks with clear task context
 * Matches CLI: update-task --id=<id> --prompt="<context>"
 * @param {Object} props
 * @param {string} props.taskTitle - Title of the task being updated
 * @param {string} props.taskId - ID of the task being updated
 * @param {string} props.currentStatus - Current status of the task
 * @param {string} props.initialValue - Initial prompt value
 * @param {Function} props.onSubmit - Callback when update is submitted
 * @param {Function} props.onCancel - Callback when cancelled
 */
const UpdatePromptEnhanced = ({ 
	taskTitle = '', 
	taskId = '', 
	currentStatus = '',
	initialValue = '', 
	onSubmit, 
	onCancel 
}) => {
	const [value, setValue] = useState(initialValue);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useInput((input, key) => {
		if (isSubmitting) return;

		if (key.escape) {
			onCancel();
			return;
		}

		if (key.return) {
			if (value.trim()) {
				setIsSubmitting(true);
				onSubmit({ prompt: value.trim() }).then(() => {
					setIsSubmitting(false);
				});
			}
			return;
		}

		if (key.backspace || key.delete) {
			setValue(value.slice(0, -1));
		} else if (input && !key.ctrl && !key.meta) {
			setValue(value + input);
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			{/* Task Context */}
			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text color="cyan" bold>Updating: </Text>
					<Text color="white" bold>{taskTitle}</Text>
				</Box>
				<Box>
					<Text color="gray">ID: {taskId} | Status: {currentStatus}</Text>
				</Box>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray" dimColor>
					Enter new context to update this task:
				</Text>
			</Box>

			<Box
				borderStyle="single"
				borderColor={isSubmitting ? 'gray' : 'cyan'}
				paddingX={1}
				width="100%"
			>
				{isSubmitting ? (
					<Text color="blue">
						<Spinner type="dots" /> Updating task...
					</Text>
				) : (
					<>
						<Text color={value ? 'white' : 'gray'}>
							{value || 'Describe the changes or new requirements...'}
						</Text>
						<Text color="cyan">|</Text>
					</>
				)}
			</Box>

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Enter: Submit | ESC: Cancel
				</Text>
			</Box>
		</Box>
	);
};

export default UpdatePromptEnhanced;