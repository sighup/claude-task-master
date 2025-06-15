import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';
import Spinner from 'ink-spinner';
import { ProgressLoaders } from './ProgressLoader.jsx';

/**
 * ComplexityAnalysis - Analyze task complexity and generate expansion recommendations
 * Matches CLI: analyze-complexity --threshold=<1-10> [--id=<ids>] [--research]
 * @param {Object} props
 * @param {Array} props.tasks - Array of all tasks
 * @param {Function} props.onAnalyze - Function to call on analyze
 * @param {Function} props.onCancel - Function to call on cancel
 */
const ComplexityAnalysis = ({ 
	tasks,
	onAnalyze, 
	onCancel 
}) => {
	const [stage, setStage] = useState('options'); // 'options', 'taskSelection', 'confirm', 'analyzing'
	const [threshold, setThreshold] = useState('5');
	const [useResearch, setUseResearch] = useState(false);
	const [analyzeAll, setAnalyzeAll] = useState(true);
	const [selectedTaskIds, setSelectedTaskIds] = useState('');
	const [error, setError] = useState(null);
	const [analyzeStatus, setAnalyzeStatus] = useState('');

	// Get pending tasks for analysis
	const pendingTasks = tasks.filter(t => t.status === 'pending' && (!t.subtasks || t.subtasks.length === 0));

	useInput((input, key) => {
		if (stage === 'analyzing') return;

		if (key.escape) {
			onCancel();
			return;
		}

		if (stage === 'options') {
			if (key.tab) {
				// Tab through options
				if (!useResearch && analyzeAll) {
					setUseResearch(true);
				} else if (useResearch && analyzeAll) {
					setUseResearch(false);
					setAnalyzeAll(false);
				} else if (!useResearch && !analyzeAll) {
					setAnalyzeAll(true);
				}
				return;
			}

			if (input === ' ' || key.space) {
				// Toggle current option
				if (useResearch && analyzeAll) {
					setUseResearch(!useResearch);
				} else if (!useResearch && !analyzeAll) {
					setAnalyzeAll(!analyzeAll);
				}
				return;
			}

			if (key.return) {
				// Validate threshold
				const num = parseInt(threshold, 10);
				if (isNaN(num) || num < 1 || num > 10) {
					setError('Threshold must be between 1 and 10');
					return;
				}
				setError(null);
				
				if (analyzeAll) {
					setStage('confirm');
				} else {
					setStage('taskSelection');
				}
			}
		} else if (stage === 'taskSelection') {
			if (key.return) {
				// Validate task IDs
				if (!selectedTaskIds.trim()) {
					setError('Please enter task IDs (e.g., 1,3,5)');
					return;
				}
				
				const ids = selectedTaskIds.split(',').map(id => parseInt(id.trim(), 10));
				const invalidIds = ids.filter(id => isNaN(id) || !tasks.find(t => t.id === id));
				
				if (invalidIds.length > 0) {
					setError(`Invalid task IDs: ${invalidIds.join(', ')}`);
					return;
				}
				
				setError(null);
				setStage('confirm');
			}
		} else if (stage === 'confirm') {
			if (input === 'y' || input === 'Y' || key.return) {
				handleAnalyze();
			} else if (input === 'n' || input === 'N') {
				onCancel();
			}
		}
	});

	const handleAnalyze = async () => {
		setStage('analyzing');
		setAnalyzeStatus('Analyzing task complexity...');
		
		try {
			const options = {
				threshold: parseInt(threshold, 10),
				research: useResearch
			};

			if (!analyzeAll && selectedTaskIds) {
				options.id = selectedTaskIds;
			}

			setAnalyzeStatus('Generating expansion recommendations...');
			const success = await onAnalyze(options);
			
			if (!success) {
				setError('Failed to analyze complexity');
				setStage('confirm');
			}
		} catch (err) {
			setError(err.message || 'Failed to analyze complexity');
			setStage('confirm');
		}
	};

	if (stage === 'analyzing') {
		return (
			<Box flexDirection="column" width="100%">
				<ProgressLoaders.ComplexityAnalysis
					title={analyzeStatus || (analyzeAll 
						? `Analyzing ${pendingTasks.length} tasks...`
						: `Analyzing selected tasks...`
					)}
					subtitle={`Threshold: ${threshold} | ${useResearch ? 'Research mode enabled' : 'Standard analysis'}`}
					showResearchMode={useResearch}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%">
			{stage === 'options' && (
				<>
					<Text color="white" bold>Complexity Threshold (1-10):</Text>
					<Box marginTop={1}>
						<TextInput
							value={threshold}
							onChange={setThreshold}
							placeholder="5"
						/>
					</Box>
					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Tasks with complexity ≥ {threshold} will be recommended for expansion
						</Text>
					</Box>

					<Box marginTop={1} flexDirection="column">
						<Text color="white" bold>Options:</Text>
						<Box marginLeft={2} marginTop={1}>
							<Text color={useResearch ? 'green' : 'gray'}>
								[{useResearch ? '✓' : ' '}] Use research model for enhanced analysis
							</Text>
						</Box>
						<Box marginLeft={2}>
							<Text color={analyzeAll ? 'green' : 'gray'}>
								[{analyzeAll ? '●' : '○'}] Analyze all pending tasks
							</Text>
						</Box>
						<Box marginLeft={2}>
							<Text color={!analyzeAll ? 'green' : 'gray'}>
								[{!analyzeAll ? '●' : '○'}] Analyze specific tasks
							</Text>
						</Box>
					</Box>

					{error && (
						<Box marginTop={1}>
							<Text color="red">{error}</Text>
						</Box>
					)}

					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Tab: Navigate options | Space: Toggle | Enter: Continue | ESC: Cancel
						</Text>
					</Box>
				</>
			)}

			{stage === 'taskSelection' && (
				<>
					<Text color="white" bold>Enter Task IDs to analyze:</Text>
					<Box marginTop={1}>
						<TextInput
							value={selectedTaskIds}
							onChange={setSelectedTaskIds}
							placeholder="1,3,5"
						/>
					</Box>
					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Enter comma-separated task IDs (e.g., 1,3,5)
						</Text>
					</Box>

					{error && (
						<Box marginTop={1}>
							<Text color="red">{error}</Text>
						</Box>
					)}

					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Enter: Continue | ESC: Cancel
						</Text>
					</Box>
				</>
			)}

			{stage === 'confirm' && (
				<>
					<Box flexDirection="column" marginBottom={1}>
						<Text color="white" bold>Complexity Analysis Summary:</Text>
						<Box marginLeft={2} marginTop={1} flexDirection="column">
							<Text color="gray">Threshold: <Text color="cyan">≥ {threshold}</Text></Text>
							<Text color="gray">Research mode: <Text color={useResearch ? 'green' : 'gray'}>{useResearch ? 'Yes' : 'No'}</Text></Text>
							<Text color="gray">
								Tasks to analyze: <Text color="cyan">
									{analyzeAll ? `${pendingTasks.length} pending tasks` : `${selectedTaskIds.split(',').length} selected tasks`}
								</Text>
							</Text>
						</Box>
					</Box>

					<Box>
						<Text color="white">Run complexity analysis? </Text>
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
				</>
			)}
		</Box>
	);
};

export default ComplexityAnalysis;