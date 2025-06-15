import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { useInput } from 'ink';
import { ProgressLoaders } from './ProgressLoader.jsx';

/**
 * BatchUpdateModal - Update multiple tasks from a starting ID
 * Matches CLI: update --from=<id> --prompt="<context>"
 * @param {Object} props
 * @param {Array} props.tasks - All tasks
 * @param {Function} props.onSubmit - Function to call with update data
 * @param {Function} props.onCancel - Function to call on cancel
 */
const BatchUpdateModal = ({ tasks = [], onSubmit, onCancel }) => {
	const [stage, setStage] = useState('fromId'); // 'fromId', 'prompt', 'confirm', 'updating'
	const [fromId, setFromId] = useState('');
	const [prompt, setPrompt] = useState('');
	const [affectedTasks, setAffectedTasks] = useState([]);
	const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
	const [error, setError] = useState(null);

	// Calculate affected tasks when fromId changes
	useEffect(() => {
		if (fromId && tasks.length > 0) {
			const fromIdNum = parseInt(fromId, 10);
			if (!isNaN(fromIdNum)) {
				const affected = tasks.filter(task => {
					const taskIdNum = parseInt(task.id, 10);
					return !isNaN(taskIdNum) && taskIdNum >= fromIdNum;
				});
				setAffectedTasks(affected);
			} else {
				setAffectedTasks([]);
			}
		} else {
			setAffectedTasks([]);
		}
	}, [fromId, tasks]);

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		if (stage === 'confirm') {
			if (input === 'y' || input === 'Y' || key.return) {
				// Start update
				setStage('updating');
				onSubmit({
					fromId,
					prompt,
					tasks: affectedTasks
				}).then((success) => {
					if (!success) {
						setError('Failed to update tasks');
						setStage('error');
					}
				});
			} else if (input === 'n' || input === 'N') {
				setStage('prompt');
			}
		}

		if (stage === 'error' && key.return) {
			onCancel();
		}
	});

	if (stage === 'fromId') {
		return (
			<Box flexDirection="column" width="100%">
				<Box marginBottom={1}>
					<Text color="cyan" bold>Batch Update Tasks</Text>
				</Box>
				<Box marginBottom={1}>
					<Text>Enter the starting task ID (all tasks from this ID onwards will be updated):</Text>
				</Box>
				<Box>
					<Text>From ID: </Text>
					<TextInput
						value={fromId}
						onChange={setFromId}
						onSubmit={() => {
							if (fromId && affectedTasks.length > 0) {
								setStage('prompt');
							} else {
								setError('Invalid ID or no tasks found');
							}
						}}
						placeholder="e.g., 10"
					/>
				</Box>
				{affectedTasks.length > 0 && (
					<Box marginTop={1}>
						<Text color="gray">Will affect {affectedTasks.length} task{affectedTasks.length !== 1 ? 's' : ''}</Text>
					</Box>
				)}
				{error && (
					<Box marginTop={1}>
						<Text color="red">{error}</Text>
					</Box>
				)}
			</Box>
		);
	}

	if (stage === 'prompt') {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text color="cyan" bold>Update Context</Text>
				</Box>
				<Box marginBottom={1}>
					<Text>Enter the context to apply to {affectedTasks.length} task{affectedTasks.length !== 1 ? 's' : ''} (ID {fromId} and above):</Text>
				</Box>
				<Box>
					<Text>Context: </Text>
					<TextInput
						value={prompt}
						onChange={setPrompt}
						onSubmit={() => {
							if (prompt.trim()) {
								setStage('confirm');
							}
						}}
						placeholder="e.g., Use TypeScript instead of JavaScript"
					/>
				</Box>
				<Box marginTop={1}>
					<Text color="gray" dimColor>Press ESC to cancel</Text>
				</Box>
			</Box>
		);
	}

	if (stage === 'confirm') {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text color="yellow" bold>Confirm Batch Update</Text>
				</Box>
				<Box marginBottom={1}>
					<Text>Update {affectedTasks.length} task{affectedTasks.length !== 1 ? 's' : ''} with:</Text>
				</Box>
				<Box marginBottom={1} flexDirection="column">
					<Text color="gray">Context: "{prompt}"</Text>
				</Box>
				<Box marginBottom={1} flexDirection="column">
					<Text color="gray">Affected tasks:</Text>
					{affectedTasks.slice(0, 5).map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="gray">• {task.id}: {task.title}</Text>
						</Box>
					))}
					{affectedTasks.length > 5 && (
						<Box marginLeft={2}>
							<Text color="gray">• ... and {affectedTasks.length - 5} more</Text>
						</Box>
					)}
				</Box>
				<Box>
					<Text>Proceed? [Y/n] </Text>
					<Text color="gray" dimColor>(Enter=Yes, N=No, ESC=Cancel)</Text>
				</Box>
			</Box>
		);
	}

	if (stage === 'updating') {
		return (
			<Box flexDirection="column" width="100%">
				<ProgressLoaders.BatchUpdate
					title={`Updating ${affectedTasks.length} tasks from ID ${fromId}...`}
					subtitle={updateProgress.total > 0 
						? `Progress: ${updateProgress.current}/${updateProgress.total} tasks`
						: `Processing: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`
					}
				/>
			</Box>
		);
	}

	if (stage === 'error') {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text color="red" bold>❌ Update Failed</Text>
				</Box>
				<Text color="red">{error}</Text>
				<Box marginTop={1}>
					<Text color="gray" dimColor>Press Enter to close</Text>
				</Box>
			</Box>
		);
	}

	return null;
};

export default BatchUpdateModal;