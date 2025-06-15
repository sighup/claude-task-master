import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';
import Spinner from 'ink-spinner';
import fs from 'fs';
import path from 'path';
import { ProgressLoaders } from './ProgressLoader.jsx';

/**
 * PrdParser - Parse PRD file and generate tasks
 * Matches CLI: parse-prd --input=<file> --num-tasks=<n> [--append] [--research]
 * @param {Object} props
 * @param {string} props.projectRoot - Project root directory
 * @param {Function} props.onParse - Function to call on parse
 * @param {Function} props.onCancel - Function to call on cancel
 */
const PrdParser = ({ 
	projectRoot,
	onParse, 
	onCancel 
}) => {
	const [stage, setStage] = useState('file'); // 'file', 'options', 'confirm', 'parsing'
	const [inputFile, setInputFile] = useState('.taskmaster/docs/prd.txt');
	const [numTasks, setNumTasks] = useState('10');
	const [useResearch, setUseResearch] = useState(false);
	const [appendMode, setAppendMode] = useState(false);
	const [error, setError] = useState(null);
	const [parseStatus, setParseStatus] = useState('');
	const [currentField, setCurrentField] = useState(0); // 0: numTasks input, 1: research toggle, 2: append toggle

	const defaultPrdPath = path.join(projectRoot, '.taskmaster/docs/prd.txt');
	const tasksPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');

	useInput((input, key) => {
		if (stage === 'parsing') return;

		if (key.escape) {
			onCancel();
			return;
		}

		if (stage === 'file') {
			if (key.return) {
				// Validate file exists
				const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(projectRoot, inputFile);
				if (!fs.existsSync(fullPath)) {
					setError(`File not found: ${fullPath}`);
					return;
				}
				setError(null);
				setStage('options');
			}
		} else if (stage === 'options') {
			// Arrow key navigation
			if (key.upArrow || key.downArrow) {
				const totalFields = 3; // numTasks, research, append
				if (key.downArrow) {
					setCurrentField((prev) => (prev + 1) % totalFields);
				} else {
					setCurrentField((prev) => (prev - 1 + totalFields) % totalFields);
				}
				return;
			}

			// Field-specific handling
			if (currentField === 0) {
				// NumTasks field - handled by TextInput
			} else if (currentField === 1) {
				// Research toggle
				if (input === ' ' || key.space || key.return) {
					setUseResearch(!useResearch);
					return;
				}
			} else if (currentField === 2) {
				// Append toggle
				if (input === ' ' || key.space || key.return) {
					setAppendMode(!appendMode);
					return;
				}
			}

			if (key.tab) {
				// Tab through options
				setCurrentField((prev) => (prev + 1) % 3);
				return;
			}

			if (key.return && currentField === 0) {
				// Submit when pressing enter on the numTasks field
				const num = parseInt(numTasks, 10);
				if (isNaN(num) || num < 1 || num > 100) {
					setError('Number of tasks must be between 1 and 100');
					return;
				}
				setError(null);
				setStage('confirm');
			}
		} else if (stage === 'confirm') {
			if (input === 'y' || input === 'Y' || key.return) {
				handleParse();
			} else if (input === 'n' || input === 'N') {
				onCancel();
			}
		}
	});

	const handleParse = async () => {
		setStage('parsing');
		setParseStatus('Reading PRD file...');
		
		try {
			const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(projectRoot, inputFile);
			const options = {
				input: fullPath,
				numTasks: parseInt(numTasks, 10),
				research: useResearch,
				append: appendMode,
				force: true // Skip confirmation in UI
			};

			setParseStatus('Generating tasks from PRD...');
			const success = await onParse(options);
			
			if (!success) {
				setError('Failed to parse PRD');
				setStage('confirm');
			}
		} catch (err) {
			setError(err.message || 'Failed to parse PRD');
			setStage('confirm');
		}
	};

	if (stage === 'parsing') {
		return (
			<Box flexDirection="column" padding={1}>
				<Box borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
					<Text bold color="white">
						Parsing PRD Document
					</Text>
				</Box>
				
				<ProgressLoaders.PrdParsing
					title={parseStatus || "Parsing PRD document..."}
					subtitle={`Generating ~${numTasks} tasks | ${appendMode ? 'Append mode' : 'Replace mode'}`}
					showResearchMode={useResearch}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{stage === 'file' && (
				<>
					<Text color="white" bold>PRD File Path:</Text>
					<Box marginTop={1}>
						<TextInput
							value={inputFile}
							onChange={setInputFile}
							placeholder={defaultPrdPath}
						/>
					</Box>
					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Enter path relative to project root or absolute path
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

			{stage === 'options' && (
				<>
					<Box marginBottom={1}>
						<Text color="green">✓ File: {inputFile}</Text>
					</Box>

					<Text color={currentField === 0 ? 'cyan' : 'white'} bold>
						Number of tasks to generate:
					</Text>
					<Box marginTop={1}>
						<TextInput
							value={numTasks}
							onChange={setNumTasks}
							placeholder="10"
							focus={currentField === 0}
						/>
					</Box>

					<Box marginTop={1} flexDirection="column">
						<Text color="white" bold>Options:</Text>
						<Box marginLeft={2} marginTop={1}>
							<Text color={currentField === 1 ? 'cyan' : (useResearch ? 'green' : 'gray')}>
								{currentField === 1 ? '▸ ' : '  '}[{useResearch ? '✓' : ' '}] Use research model for enhanced analysis
							</Text>
						</Box>
						<Box marginLeft={2}>
							<Text color={currentField === 2 ? 'cyan' : (appendMode ? 'green' : 'gray')}>
								{currentField === 2 ? '▸ ' : '  '}[{appendMode ? '✓' : ' '}] Append to existing tasks (don't overwrite)
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
							↑/↓ or Tab: Navigate | Space: Toggle | Enter: Continue | ESC: Cancel
						</Text>
					</Box>
				</>
			)}

			{stage === 'confirm' && (
				<>
					<Box flexDirection="column" marginBottom={1}>
						<Text color="white" bold>Parse PRD Summary:</Text>
						<Box marginLeft={2} marginTop={1} flexDirection="column">
							<Text color="gray">File: <Text color="cyan">{inputFile}</Text></Text>
							<Text color="gray">Tasks to generate: <Text color="cyan">{numTasks}</Text></Text>
							<Text color="gray">Research mode: <Text color={useResearch ? 'green' : 'gray'}>{useResearch ? 'Yes' : 'No'}</Text></Text>
							<Text color="gray">Append mode: <Text color={appendMode ? 'green' : 'gray'}>{appendMode ? 'Yes' : 'No'}</Text></Text>
						</Box>
					</Box>

					{!appendMode && fs.existsSync(tasksPath) && (
						<Box marginBottom={1}>
							<Text color="yellow">⚠️  This will overwrite existing tasks.json!</Text>
						</Box>
					)}

					<Box>
						<Text color="white">Generate tasks from PRD? </Text>
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

export default PrdParser;