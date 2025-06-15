import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { useInput } from 'ink';

/**
 * SubtaskManager - Add a new subtask to a parent task
 * Matches CLI: add-subtask --parent-id=<id> --title="<title>" --description="<desc>"
 * @param {Object} props
 * @param {string} props.parentTaskId - Parent task ID
 * @param {string} props.parentTaskTitle - Parent task title for display
 * @param {Object} props.taskToConvert - Optional task to convert to subtask
 * @param {Function} props.onSubmit - Function to call with subtask data
 * @param {Function} props.onCancel - Function to call on cancel
 */
const SubtaskManager = ({ 
	parentTaskId, 
	parentTaskTitle = '', 
	taskToConvert = null,
	onSubmit, 
	onCancel 
}) => {
	const [stage, setStage] = useState(taskToConvert ? 'confirm' : 'title'); // 'title', 'description', 'confirm', 'submitting'
	const [title, setTitle] = useState(taskToConvert?.title || '');
	const [description, setDescription] = useState(taskToConvert?.description || '');
	const [error, setError] = useState(null);

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		// Skip input handling during text input stages
		if ((stage === 'title' || stage === 'description') && !key.return) {
			return;
		}

		if (stage === 'confirm') {
			if (input === 'y' || input === 'Y' || key.return) {
				handleSubmit();
			} else if (input === 'n' || input === 'N') {
				setStage('title');
			}
		}
	});

	const handleSubmit = async () => {
		setStage('submitting');
		
		const subtaskData = {
			title: title.trim(),
			description: description.trim() || undefined,
			taskId: taskToConvert?.id || undefined
		};

		try {
			const success = await onSubmit(subtaskData);
			if (!success) {
				setError('Failed to add subtask');
				setStage('title');
			}
		} catch (err) {
			setError(err.message || 'Failed to add subtask');
			setStage('title');
		}
	};

	if (stage === 'submitting') {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="blue" bold>
					<Spinner type="dots" /> {taskToConvert ? 'Converting task to subtask...' : 'Adding subtask...'}
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Parent Task Context */}
			<Box marginBottom={1}>
				<Text color="cyan" bold>Parent Task: </Text>
				<Text color="white">{parentTaskTitle}</Text>
				<Text color="gray"> (ID: {parentTaskId})</Text>
			</Box>

			{taskToConvert && (
				<Box marginBottom={1}>
					<Text color="yellow">Converting task to subtask: {taskToConvert.title}</Text>
				</Box>
			)}

			{stage === 'title' && (
				<>
					<Box marginBottom={1}>
						<Text>Enter subtask title{taskToConvert ? ' (or press Enter to keep current)' : ''}:</Text>
					</Box>
					<Box>
						<TextInput
							value={title}
							onChange={setTitle}
							onSubmit={() => {
								if (title.trim() || taskToConvert) {
									setStage('description');
								} else {
									setError('Title is required');
								}
							}}
							placeholder={taskToConvert ? taskToConvert.title : "e.g., Implement authentication"}
						/>
					</Box>
				</>
			)}

			{stage === 'description' && (
				<>
					<Box marginBottom={1}>
						<Text>Enter subtask description (optional, press Enter to skip):</Text>
					</Box>
					<Box>
						<TextInput
							value={description}
							onChange={setDescription}
							onSubmit={() => setStage('confirm')}
							placeholder="e.g., Add JWT token validation..."
						/>
					</Box>
				</>
			)}

			{stage === 'confirm' && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text color="yellow" bold>Confirm Subtask Creation</Text>
					</Box>
					<Box marginBottom={1} flexDirection="column">
						<Text>Title: {title}</Text>
						{description && <Text>Description: {description}</Text>}
					</Box>
					<Box>
						<Text>Add this subtask? [Y/n] </Text>
						<Text color="gray" dimColor>(Enter=Yes, N=No, ESC=Cancel)</Text>
					</Box>
				</Box>
			)}

			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					{stage === 'title' || stage === 'description' ? 'Enter to continue, ' : ''}
					ESC to cancel
				</Text>
			</Box>
		</Box>
	);
};

export default SubtaskManager;