import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

/**
 * ProgressLoader - A component that shows progress messages during long operations
 * @param {Object} props
 * @param {string} props.title - The main title of the operation
 * @param {string} [props.subtitle] - Optional subtitle text
 * @param {boolean} [props.showElapsedTime=true] - Whether to show elapsed time
 * @param {boolean} [props.showResearchMode] - Whether to show research mode indicator
 * @param {Array} [props.messages] - Custom progress messages with timing
 * @param {number} [props.warningThreshold=30] - Time in seconds before showing warning
 */
export function ProgressLoader({
	title,
	subtitle,
	showElapsedTime = true,
	showResearchMode = false,
	messages = null,
	warningThreshold = 30
}) {
	const [progressMessage, setProgressMessage] = useState('Initializing...');
	const [elapsedTime, setElapsedTime] = useState(0);

	// Default messages for various operations
	const defaultMessages = messages || [
		{ time: 0, message: 'Initializing AI service...' },
		{ time: 3000, message: 'Processing request...' },
		{ time: 6000, message: 'Analyzing context...' },
		{ time: 10000, message: 'Generating response...' },
		{ time: 15000, message: 'Almost there...' },
		{ time: 20000, message: 'This is taking longer than usual...' },
		{ time: 30000, message: 'Still working on it...' },
		{ time: 45000, message: 'Complex operation in progress...' }
	];

	useEffect(() => {
		const startTime = Date.now();
		
		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			setElapsedTime(Math.floor(elapsed / 1000));
			
			// Find the appropriate message
			const currentMessage = defaultMessages
				.filter(m => m.time <= elapsed)
				.pop();
			if (currentMessage) {
				setProgressMessage(currentMessage.message);
			}
		}, 100);
		
		return () => clearInterval(interval);
	}, [defaultMessages]);

	return (
		<Box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text color="#3B82F6">
					<Spinner type="dots" />
					{' '}
					{title}
				</Text>
			</Box>
			
			{subtitle && (
				<Box marginBottom={1}>
					<Text color="gray">{subtitle}</Text>
				</Box>
			)}
			
			<Box marginBottom={1}>
				<Text color="gray">{progressMessage}</Text>
			</Box>
			
			{showResearchMode && (
				<Box marginBottom={1}>
					<Text color="#F59E0B">
						<Spinner type="dots2" />
						{' '}Research mode enabled - gathering context...
					</Text>
				</Box>
			)}
			
			{showElapsedTime && (
				<Box marginTop={1}>
					<Text color="gray" dimColor>
						Time elapsed: {elapsedTime}s
					</Text>
				</Box>
			)}
			
			{elapsedTime > warningThreshold && (
				<Box marginTop={1} flexDirection="column" alignItems="center">
					<Text color="#EAB308">
						⚠️  This is taking longer than expected.
					</Text>
					<Text color="gray">
						The AI service might be experiencing delays.
					</Text>
				</Box>
			)}
		</Box>
	);
}

// Preset progress loaders for common operations
export const ProgressLoaders = {
	TaskExpansion: (props) => (
		<ProgressLoader
			title={props.title || "Generating subtasks..."}
			messages={[
				{ time: 0, message: 'Initializing AI service...' },
				{ time: 3000, message: 'Analyzing task requirements...' },
				{ time: 6000, message: 'Generating subtask structure...' },
				{ time: 10000, message: 'Refining task details...' },
				{ time: 15000, message: 'Finalizing subtasks...' },
				{ time: 20000, message: 'This is taking longer than usual...' }
			]}
			{...props}
		/>
	),
	
	BatchUpdate: (props) => (
		<ProgressLoader
			title={props.title || "Updating tasks..."}
			messages={[
				{ time: 0, message: 'Preparing batch update...' },
				{ time: 3000, message: 'Analyzing task dependencies...' },
				{ time: 6000, message: 'Applying updates...' },
				{ time: 10000, message: 'Updating task relationships...' },
				{ time: 15000, message: 'Finalizing changes...' },
				{ time: 20000, message: 'Processing complex updates...' }
			]}
			{...props}
		/>
	),
	
	PrdParsing: (props) => (
		<ProgressLoader
			title={props.title || "Parsing PRD document..."}
			messages={[
				{ time: 0, message: 'Reading document...' },
				{ time: 3000, message: 'Analyzing requirements...' },
				{ time: 6000, message: 'Extracting tasks...' },
				{ time: 10000, message: 'Organizing task hierarchy...' },
				{ time: 15000, message: 'Generating task details...' },
				{ time: 20000, message: 'Complex document - still processing...' },
				{ time: 30000, message: 'Large PRD - this may take a while...' }
			]}
			{...props}
		/>
	),
	
	ComplexityAnalysis: (props) => (
		<ProgressLoader
			title={props.title || "Analyzing task complexity..."}
			messages={[
				{ time: 0, message: 'Loading tasks...' },
				{ time: 3000, message: 'Evaluating dependencies...' },
				{ time: 6000, message: 'Calculating complexity scores...' },
				{ time: 10000, message: 'Generating recommendations...' },
				{ time: 15000, message: 'Finalizing analysis...' }
			]}
			{...props}
		/>
	),
	
	DependencyValidation: (props) => (
		<ProgressLoader
			title={props.title || "Validating dependencies..."}
			messages={[
				{ time: 0, message: 'Scanning task relationships...' },
				{ time: 3000, message: 'Checking for circular dependencies...' },
				{ time: 6000, message: 'Validating task order...' },
				{ time: 10000, message: 'Analyzing dependency chains...' }
			]}
			warningThreshold={15}
			{...props}
		/>
	),
	
	TaskCreation: (props) => (
		<ProgressLoader
			title={props.title || "Creating task..."}
			messages={[
				{ time: 0, message: 'Initializing AI service...' },
				{ time: 3000, message: 'Processing your request...' },
				{ time: 6000, message: 'Analyzing task requirements...' },
				{ time: 10000, message: 'Generating task structure...' },
				{ time: 15000, message: 'Refining task details...' },
				{ time: 20000, message: 'Almost ready...' },
				{ time: 25000, message: 'This is taking longer than usual...' },
				{ time: 35000, message: 'Complex task - still processing...' }
			]}
			showResearchMode={props.showResearchMode}
			warningThreshold={30}
			{...props}
		/>
	)
};