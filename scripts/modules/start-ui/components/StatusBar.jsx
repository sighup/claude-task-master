import React, { useState, useEffect, memo } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

/**
 * Status bar component showing project info and task statistics
 * @param {Object} props - Component props
 * @param {string} props.projectRoot - Project root directory path
 * @param {Object} [props.metadata={}] - Task statistics metadata
 * @param {number} props.metadata.totalTasks - Total number of tasks
 * @param {number} props.metadata.pendingTasks - Number of pending tasks
 * @param {number} props.metadata.completedTasks - Number of completed tasks
 * @param {number} props.metadata.inProgressTasks - Number of in-progress tasks
 * @param {string|null} props.error - Error message to display
 * @param {Object|null} props.nextTask - Next available task info
 * @param {number} [props.selectedIndex=-1] - Currently selected task index
 * @param {number} [props.totalTasks=0] - Total number of tasks in view
 * @param {Object} [props.projectStatus=null] - Project status including API key info
 * @returns {React.Component} The status bar component
 */
export const StatusBar = memo(function StatusBar({
	projectRoot,
	metadata = {},
	error,
	nextTask,
	selectedIndex = -1,
	lastUpdated = null,
	projectStatus = null
}) {
	const projectName = projectRoot
		? projectRoot.split('/').pop()
		: 'Unknown Project';

	// Calculate progress percentages with safe defaults
	const totalTasks = metadata?.totalTasks || 0;
	const completedTasks = metadata?.completedTasks || 0;
	const inProgressTasks = metadata?.inProgressTasks || 0;
	const pendingTasks = metadata?.pendingTasks || 0;

	const progressPercentage =
		totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	// Update time only once per second to prevent constant re-renders
	// Use fixed-width time format to prevent layout shifts
	const formatTime = () => {
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	};
	
	const [currentTime, setCurrentTime] = useState(formatTime());
	
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(formatTime());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<Box flexDirection="column" width="100%" flexShrink={0}>
			<Box borderStyle="single" borderColor="blue" paddingX={1} width="100%">
				<Box flexDirection="row" justifyContent="space-between" width="100%">
					{/* Left side - Project info and dashboard */}
					<Box flexDirection="column">
						<Box flexDirection="row">
							<Text bold color="cyan">
								Task Master AI
							</Text>
							<Text color="gray"> - {projectName}</Text>
						</Box>
						<Box flexDirection="row">
							<Text color="white">Tasks Progress: </Text>
							<Text color="#10B981" bold>
								{String(progressPercentage).padStart(3, ' ')}%
							</Text>
							<Text color="gray"> | Done: </Text>
							<Text color="#10B981">{String(completedTasks).padStart(2, ' ')}</Text>
							<Text color="gray"> | In Progress: </Text>
							<Text color="#FFA500">{String(inProgressTasks).padStart(2, ' ')}</Text>
							<Text color="gray"> | Pending: </Text>
							<Text color="#EAB308">{String(pendingTasks).padStart(2, ' ')}</Text>
						</Box>
					</Box>

					{/* Right side - Quick stats and navigation */}
					{error ? (
						<Text color="red">Error: {error}</Text>
					) : (
						<Box flexDirection="column" alignItems="flex-end">
							<Text color="white">Total: {String(totalTasks).padStart(3, ' ')}</Text>
							<Box flexDirection="row">
								<Text color="#EAB308">
									Task {String(selectedIndex + 1).padStart(2, ' ')}/{String(totalTasks).padStart(2, ' ')} |{' '}
								</Text>
								<Text color="gray">{currentTime}</Text>
							</Box>
						</Box>
					)}
				</Box>
			</Box>

			{/* API Key warning bar */}
			{projectStatus?.missingApiKeys?.length > 0 && (
				<Box
					borderStyle="single"
					borderColor="yellow"
					paddingX={1}
					width="100%"
				>
					<Text color="yellow">
						⚠️  Missing API keys: {projectStatus.missingApiKeys.join(', ')}
					</Text>
				</Box>
			)}

			{/* Next task info bar */}
			{nextTask && !error && (
				<Box
					borderStyle="single"
					borderColor="#F59E0B"
					paddingX={1}
					width="100%"
				>
					<Box flexDirection="row">
						<Text color="#F59E0B" bold>
							Next:{' '}
						</Text>
						<Text color="white">[{nextTask.id}] </Text>
						<Text
							color={
								nextTask.priority === 'high'
									? '#EF4444'
									: nextTask.priority === 'medium'
										? '#EAB308'
										: '#6B7280'
							}
						>
							{nextTask.priority?.charAt(0).toUpperCase() || 'M'}
						</Text>
						<Text> {nextTask.title}</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
});
