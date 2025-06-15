import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { ProgressLoaders } from './ProgressLoader.jsx';

// Constants
const STAGES = {
	TASK_SELECT: 'task_select',
	OPTIONS: 'options',
	EXPANDING: 'expanding',
	COMPLETE: 'complete',
	ERROR: 'error'
};

const PRIORITY_COLORS = {
	high: '#EF4444',
	medium: '#EAB308',
	low: '#6B7280'
};

export function TaskExpander({
	tasks,
	complexityReport,
	onExpand,
	onExpandAll,
	onClose
}) {
	const [stage, setStage] = useState(STAGES.TASK_SELECT);
	const [selectedTask, setSelectedTask] = useState(null);
	const [options, setOptions] = useState({
		numSubtasks: '',
		useResearch: false,
		expandAll: false,
		additionalContext: ''
	});
	const [expandResult, setExpandResult] = useState(null);
	const [error, setError] = useState(null);
	const [currentInput, setCurrentInput] = useState('task');
	const { stdout } = useStdout();

	const terminalHeight = stdout?.rows || 24;
	const terminalWidth = stdout?.columns || 80;

	// Get tasks that can be expanded
	const expandableTasks = tasks.filter(task => 
		task.status === 'pending' && 
		(!task.subtasks || task.subtasks.length === 0)
	);

	// Get high complexity tasks if complexity report exists
	const highComplexityTasks = complexityReport ? expandableTasks.filter(task => {
		const complexity = complexityReport.tasks?.find(t => t.id === task.id);
		return complexity && complexity.complexity >= (complexityReport.threshold || 5);
	}) : [];

	// Create select items for task selection
	const taskSelectItems = [
		...expandableTasks.map(task => {
			const complexity = complexityReport?.tasks?.find(t => t.id === task.id);
			return {
				label: `${task.id}. ${task.title} ${complexity ? `(Complexity: ${complexity.complexity})` : ''}`,
				value: task.id.toString(),
				task
			};
		}),
		...(highComplexityTasks.length > 0 ? [
			{ label: '──────────────────────────────────────', value: 'separator', disabled: true },
			{ 
				label: `🚀 Expand all high-complexity tasks (${highComplexityTasks.length} tasks)`, 
				value: 'expand-all',
				isExpandAll: true
			}
		] : [])
	];

	// Reset on close
	useEffect(() => {
		return () => {
			setStage(STAGES.TASK_SELECT);
			setSelectedTask(null);
			setOptions({
				numSubtasks: '',
				useResearch: false,
				expandAll: false,
				additionalContext: ''
			});
			setError(null);
		};
	}, []);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape) {
			if (stage === STAGES.EXPANDING) return; // Can't cancel during expansion
			if (stage === STAGES.ERROR || stage === STAGES.COMPLETE) {
				onClose();
			} else if (stage === STAGES.OPTIONS) {
				setStage(STAGES.TASK_SELECT);
			} else {
				onClose();
			}
			return;
		}

		// Stage-specific input handling
		switch (stage) {
			case STAGES.OPTIONS:
				const inputs = ['numSubtasks', 'research', 'context', 'confirm'];
				const currentIndex = inputs.indexOf(currentInput);
				
				// Arrow key navigation
				if (key.downArrow || key.tab) {
					// Move to next field
					setCurrentInput(inputs[(currentIndex + 1) % inputs.length]);
				} else if (key.upArrow) {
					// Move to previous field
					setCurrentInput(inputs[(currentIndex - 1 + inputs.length) % inputs.length]);
				} else if (input === 'r' && currentInput === 'research') {
					setOptions(prev => ({ ...prev, useResearch: !prev.useResearch }));
				} else if ((key.return || key.space) && currentInput === 'research') {
					// Toggle research mode with enter or space
					setOptions(prev => ({ ...prev, useResearch: !prev.useResearch }));
				} else if (key.return && currentInput === 'confirm') {
					handleExpansion();
				} else if (key.return && currentInput === 'numSubtasks' && !options.expandAll) {
					// Move to next field when pressing enter on numSubtasks
					setCurrentInput(inputs[(currentIndex + 1) % inputs.length]);
				}
				break;

			case STAGES.COMPLETE:
			case STAGES.ERROR:
				if (key.return) {
					onClose();
				}
				break;
		}
	});

	// Handle task selection
	const handleTaskSelect = (item) => {
		if (item.value === 'separator') return;
		
		if (item.isExpandAll) {
			setOptions(prev => ({ ...prev, expandAll: true }));
			setStage(STAGES.OPTIONS);
		} else {
			setSelectedTask(item.task);
			// Get complexity info for default subtask count
			const complexity = complexityReport?.tasks?.find(t => t.id === item.task.id);
			if (complexity?.recommendedSubtasks) {
				setOptions(prev => ({ 
					...prev, 
					numSubtasks: complexity.recommendedSubtasks.toString() 
				}));
			}
			setStage(STAGES.OPTIONS);
		}
	};

	// Handle expansion
	const handleExpansion = async () => {
		setStage(STAGES.EXPANDING);
		setError(null);

		try {
			let result;
			if (options.expandAll) {
				result = await onExpandAll({
					useResearch: options.useResearch,
					prompt: options.additionalContext || undefined
				});
			} else if (selectedTask) {
				result = await onExpand({
					taskId: selectedTask.id.toString(),
					numSubtasks: options.numSubtasks || 3,
					useResearch: options.useResearch,
					prompt: options.additionalContext || undefined
				});
			}

			if (result === true || (result && typeof result === 'object')) {
				// Handle both boolean success and object results
				setExpandResult(result === true ? {} : result);
				setStage(STAGES.COMPLETE);
			} else {
				throw new Error('Expansion returned false - check model configuration');
			}
		} catch (err) {
			// Provide more specific error messages
			let errorMessage = err.message || 'Failed to expand tasks';
			
			// Check for common issues
			if (errorMessage.includes('API key') || errorMessage.includes('not set')) {
				errorMessage = 'API key not configured. Set your API key in environment variables or .env file.';
			} else if (errorMessage.includes('failed for all configured roles')) {
				errorMessage = 'AI service unavailable. Check that your API keys are properly configured.';
			} else if (errorMessage.includes('Expansion returned false')) {
				errorMessage = 'Task expansion failed. This usually means the AI service cannot be reached.';
			}
			
			setError(errorMessage);
			setStage(STAGES.ERROR);
		}
	};

	// Render based on stage
	switch (stage) {
		case STAGES.TASK_SELECT:
			return (
				<Box flexDirection="column" width="100%">
					<Box marginBottom={1}>
						<Text color="gray">
							Select a task to expand into subtasks:
						</Text>
					</Box>

					{expandableTasks.length === 0 ? (
						<Box flexDirection="column">
							<Text color="yellow">No expandable tasks found.</Text>
							<Text color="gray" dimColor>
								All pending tasks already have subtasks or no pending tasks exist.
							</Text>
							<Box marginTop={1}>
								<Text color="gray">Press ESC to close</Text>
							</Box>
						</Box>
					) : (
						<>
							<SelectInput
								items={taskSelectItems}
								onSelect={handleTaskSelect}
								limit={Math.min(12, terminalHeight - 12)}
							/>

							<Box marginTop={1} paddingTop={1} borderStyle="single" borderTop borderColor="gray">
								<Text color="gray" dimColor>
									↑/↓: Navigate | Enter: Select | ESC: Cancel
								</Text>
							</Box>
						</>
					)}
				</Box>
			);

		case STAGES.OPTIONS:
			return (
				<Box flexDirection="column" width="100%">

					{options.expandAll ? (
						<Box flexDirection="column">
							<Box marginBottom={1}>
								<Text color="white">
									Expanding {highComplexityTasks.length} high-complexity tasks
								</Text>
							</Box>
							<Box marginBottom={1}>
								<Text color="gray">
									Tasks with complexity ≥ {complexityReport?.threshold || 5} will be expanded
								</Text>
							</Box>
						</Box>
					) : selectedTask && (
						<Box flexDirection="column" marginBottom={1}>
							<Text color="white" bold>
								Task: {selectedTask.title}
							</Text>
							{selectedTask.priority && (
								<Text color={PRIORITY_COLORS[selectedTask.priority]}>
									Priority: {selectedTask.priority}
								</Text>
							)}
						</Box>
					)}

					{!options.expandAll && (
						<Box marginBottom={1}>
							<Text color={currentInput === 'numSubtasks' ? 'cyan' : 'white'}>
								Number of subtasks: 
							</Text>
							<Box marginLeft={1}>
								<TextInput
									value={options.numSubtasks}
									onChange={(value) => setOptions(prev => ({ ...prev, numSubtasks: value }))}
									placeholder="3"
									focus={currentInput === 'numSubtasks'}
								/>
							</Box>
						</Box>
					)}

					<Box marginBottom={1}>
						<Text color={currentInput === 'research' ? 'cyan' : 'white'}>
							[R] Use research mode: {' '}
							<Text color={options.useResearch ? '#10B981' : '#6B7280'}>
								{options.useResearch ? '✓ Yes' : '○ No'}
							</Text>
						</Text>
					</Box>

					<Box marginBottom={1}>
						<Text color={currentInput === 'context' ? 'cyan' : 'white'}>
							Additional context (optional):
						</Text>
						<Box marginLeft={1}>
							<TextInput
								value={options.additionalContext}
								onChange={(value) => setOptions(prev => ({ ...prev, additionalContext: value }))}
								placeholder="Add any specific requirements..."
								focus={currentInput === 'context'}
							/>
						</Box>
					</Box>

					<Box marginTop={1} paddingTop={1} borderStyle="single" borderTop borderColor="gray">
						<Text color={currentInput === 'confirm' ? 'cyan' : 'gray'}>
							Press ENTER to start expansion
						</Text>
					</Box>

					<Box marginTop={1} paddingTop={1} borderStyle="single" borderTop borderColor="gray">
						<Text color="gray" dimColor>
							↑/↓ or TAB: Navigate | Space/R: Toggle | Enter: Confirm | ESC: Back
						</Text>
					</Box>
				</Box>
			);

		case STAGES.EXPANDING:
			return (
				<Box flexDirection="column" width="100%">
					<ProgressLoaders.TaskExpansion
						title={
							options.expandAll
								? `Expanding ${highComplexityTasks.length} high-complexity tasks...`
								: `Generating subtasks for task ${selectedTask?.id}...`
						}
						subtitle={
							options.expandAll 
								? `Complexity threshold: ${complexityReport?.threshold || 5}`
								: selectedTask?.title
						}
						showResearchMode={options.useResearch}
					/>
				</Box>
			);

		case STAGES.COMPLETE:
			return (
				<Box flexDirection="column" width="100%" alignItems="center">
					<Box marginBottom={1}>
						<Text bold color="green">
							✓ Expansion Complete!
						</Text>
					</Box>

					{options.expandAll ? (
						<Box flexDirection="column">
							<Text color="white">
								Successfully expanded {expandResult?.tasksExpanded || highComplexityTasks.length} tasks
							</Text>
							<Text color="gray">
								Total subtasks created: {expandResult?.totalSubtasksCreated || 'multiple'}
							</Text>
						</Box>
					) : (
						<Box flexDirection="column">
							<Text color="white">
								Task {selectedTask?.id} expanded successfully
							</Text>
							<Text color="gray">
								Created {expandResult?.subtasksCreated || options.numSubtasks || 3} subtasks
							</Text>
						</Box>
					)}

					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Press ENTER to close
						</Text>
					</Box>
				</Box>
			);

		case STAGES.ERROR:
			return (
				<Box flexDirection="column" width="100%">
					<Box marginBottom={1} alignItems="center">
						<Text bold color="red">
							❌ Expansion Failed
						</Text>
					</Box>

					<Box marginBottom={1}>
						<Text color="red" wrap="wrap">{error}</Text>
					</Box>

					{(error?.includes('API') || error?.includes('service')) && (
						<Box flexDirection="column" marginTop={1}>
							<Text color="yellow">💡 How to fix:</Text>
							<Box marginLeft={2} flexDirection="column">
								<Text color="gray">1. Set your API key in environment:</Text>
								<Text color="gray">   export ANTHROPIC_API_KEY="your-key"</Text>
								<Text color="gray">2. Or create a .env file with:</Text>
								<Text color="gray">   ANTHROPIC_API_KEY=your-key</Text>
								<Text color="gray">3. Restart the Task Master UI</Text>
							</Box>
						</Box>
					)}

					<Box marginTop={1} paddingTop={1} borderStyle="single" borderTop borderColor="gray">
						<Text color="gray" dimColor>
							Press ENTER or ESC to close
						</Text>
					</Box>
				</Box>
			);

		default:
			return null;
	}
}
