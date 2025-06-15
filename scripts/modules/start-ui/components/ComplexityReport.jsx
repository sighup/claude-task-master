import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'fs';
import path from 'path';

// Match status colors from other components
const STATUS_COLORS = {
	done: '#10B981', // green
	completed: '#10B981', // green
	pending: '#EAB308', // yellow
	'in-progress': '#FFA500', // orange
	blocked: '#EF4444', // red
	review: '#D946EF', // magenta
	deferred: '#6B7280', // gray
	cancelled: '#6B7280' // gray
};

// Complexity score colors
const COMPLEXITY_COLORS = {
	low: '#10B981', // green (1-3)
	medium: '#EAB308', // yellow (4-6)
	high: '#FFA500', // orange (7-8)
	veryHigh: '#EF4444' // red (9-10)
};

function getComplexityColor(score) {
	if (score <= 3) return COMPLEXITY_COLORS.low;
	if (score <= 6) return COMPLEXITY_COLORS.medium;
	if (score <= 8) return COMPLEXITY_COLORS.high;
	return COMPLEXITY_COLORS.veryHigh;
}

function getComplexityLabel(score) {
	if (score <= 3) return 'Low';
	if (score <= 6) return 'Medium';
	if (score <= 8) return 'High';
	return 'Very High';
}

export function ComplexityReport({ onClose, projectRoot }) {
	const [reportData, setReportData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const { stdout } = useStdout();

	// Calculate available height for scrollable content
	const terminalHeight = stdout?.rows || 24;
	const terminalWidth = stdout?.columns || 80;

	// Fixed sections: Header (3) + Metadata (6) + Controls (3) = 12 lines
	const fixedLines = 12;
	const maxVisibleTasks = Math.max(5, terminalHeight - fixedLines);

	useEffect(() => {
		loadComplexityReport();
	}, [projectRoot]);

	const loadComplexityReport = async () => {
		try {
			setLoading(true);
			const reportPath = path.join(
				projectRoot || process.cwd(),
				'.taskmaster',
				'reports',
				'task-complexity-report.json'
			);

			if (!fs.existsSync(reportPath)) {
				setError('No complexity report found. Run "task-master analyze" first.');
				setLoading(false);
				return;
			}

			const reportContent = fs.readFileSync(reportPath, 'utf8');
			const data = JSON.parse(reportContent);
			setReportData(data);
			setLoading(false);
		} catch (err) {
			setError(`Failed to load complexity report: ${err.message}`);
			setLoading(false);
		}
	};

	// Calculate visible tasks window
	const getVisibleTasks = () => {
		if (!reportData || !reportData.complexityAnalysis) return [];

		const tasks = reportData.complexityAnalysis;
		if (tasks.length <= maxVisibleTasks) {
			return { tasks, startIndex: 0 };
		}

		// Adjust scroll to keep selected item visible
		let start = scrollOffset;
		if (selectedIndex < scrollOffset) {
			start = selectedIndex;
		} else if (selectedIndex >= scrollOffset + maxVisibleTasks) {
			start = selectedIndex - maxVisibleTasks + 1;
		}

		// Ensure bounds
		start = Math.max(0, Math.min(start, tasks.length - maxVisibleTasks));
		
		return {
			tasks: tasks.slice(start, start + maxVisibleTasks),
			startIndex: start
		};
	};

	useInput((input, key) => {
		if (key.escape) {
			onClose();
			return;
		}

		if (!reportData || !reportData.complexityAnalysis) return;

		const totalTasks = reportData.complexityAnalysis.length;

		// Navigation
		if (key.upArrow) {
			setSelectedIndex((prev) => {
				const newIndex = Math.max(0, prev - 1);
				// Update scroll if needed
				if (newIndex < scrollOffset) {
					setScrollOffset(newIndex);
				}
				return newIndex;
			});
		}

		if (key.downArrow) {
			setSelectedIndex((prev) => {
				const newIndex = Math.min(totalTasks - 1, prev + 1);
				// Update scroll if needed
				if (newIndex >= scrollOffset + maxVisibleTasks) {
					setScrollOffset(newIndex - maxVisibleTasks + 1);
				}
				return newIndex;
			});
		}

		// Page navigation
		if (key.pageUp) {
			const pageSize = Math.floor(maxVisibleTasks / 2);
			setSelectedIndex((prev) => {
				const newIndex = Math.max(0, prev - pageSize);
				setScrollOffset(Math.max(0, scrollOffset - pageSize));
				return newIndex;
			});
		}

		if (key.pageDown) {
			const pageSize = Math.floor(maxVisibleTasks / 2);
			setSelectedIndex((prev) => {
				const newIndex = Math.min(totalTasks - 1, prev + pageSize);
				setScrollOffset(Math.min(
					Math.max(0, totalTasks - maxVisibleTasks),
					scrollOffset + pageSize
				));
				return newIndex;
			});
		}

		// Home/End
		if (key.home || (key.ctrl && input === 'a')) {
			setSelectedIndex(0);
			setScrollOffset(0);
		}

		if (key.end || (key.ctrl && input === 'e')) {
			setSelectedIndex(totalTasks - 1);
			setScrollOffset(Math.max(0, totalTasks - maxVisibleTasks));
		}
	});

	if (loading) {
		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				padding={1}
			>
				<Text color="yellow">Loading complexity report...</Text>
			</Box>
		);
	}

	if (error) {
		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				padding={1}
			>
				<Text color="red">{error}</Text>
				<Box marginTop={1}>
					<Text color="gray">Press ESC to return</Text>
				</Box>
			</Box>
		);
	}

	if (!reportData) {
		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				padding={1}
			>
				<Text color="gray">No report data available</Text>
			</Box>
		);
	}

	const { tasks: visibleTasks, startIndex } = getVisibleTasks();
	const selectedTask = reportData.complexityAnalysis[selectedIndex];
	const totalTasks = reportData.complexityAnalysis.length;

	// Calculate statistics
	const stats = {
		avgComplexity:
			reportData.complexityAnalysis.reduce((sum, task) => sum + task.complexityScore, 0) /
			reportData.complexityAnalysis.length,
		highComplexityCount: reportData.complexityAnalysis.filter(
			(task) => task.complexityScore >= reportData.meta.thresholdScore
		).length,
		totalRecommendedSubtasks: reportData.complexityAnalysis.reduce(
			(sum, task) => sum + task.recommendedSubtasks,
			0
		)
	};

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={terminalHeight}
			overflow="hidden"
		>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				width="100%"
				flexShrink={0}
			>
				<Text bold color="white">
					Task Complexity Analysis Report
				</Text>
			</Box>

			{/* Metadata Section */}
			<Box flexDirection="column" paddingX={1} marginBottom={1} flexShrink={0}>
				<Box flexDirection="row" justifyContent="space-between">
					<Text color="gray">
						Generated: <Text color="white">{new Date(reportData.meta.generatedAt).toLocaleString()}</Text>
					</Text>
					<Text color="gray">
						Project: <Text color="white">{reportData.meta.projectName}</Text>
					</Text>
				</Box>
				<Box flexDirection="row" justifyContent="space-between">
					<Text color="gray">
						Tasks Analyzed: <Text color="white">{reportData.meta.tasksAnalyzed}/{reportData.meta.totalTasks}</Text>
					</Text>
					<Text color="gray">
						Threshold: <Text color="yellow">{reportData.meta.thresholdScore}/10</Text>
					</Text>
				</Box>
				<Box flexDirection="row" justifyContent="space-between">
					<Text color="gray">
						Avg Complexity: <Text color={getComplexityColor(Math.round(stats.avgComplexity))}>{stats.avgComplexity.toFixed(1)}</Text>
					</Text>
					<Text color="gray">
						High Complexity: <Text color="#FFA500">{stats.highComplexityCount} tasks</Text>
					</Text>
				</Box>
				<Text color="gray">
					Research Mode: <Text color={reportData.meta.usedResearch ? '#10B981' : '#6B7280'}>{reportData.meta.usedResearch ? 'Enabled' : 'Disabled'}</Text>
				</Text>
			</Box>

			{/* Task List */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				{/* Column Headers */}
				<Box
					flexDirection="row"
					paddingX={1}
					borderStyle="single"
					borderColor="gray"
					flexShrink={0}
				>
					<Box width={6} flexShrink={0}>
						<Text bold color="gray">ID</Text>
					</Box>
					<Box width={10} flexShrink={0}>
						<Text bold color="gray">Score</Text>
					</Box>
					<Box width={12} flexShrink={0}>
						<Text bold color="gray">Complexity</Text>
					</Box>
					<Box width={10} flexShrink={0}>
						<Text bold color="gray">Subtasks</Text>
					</Box>
					<Box flexGrow={1}>
						<Text bold color="gray">Title</Text>
					</Box>
				</Box>

				{/* Task Rows */}
				<Box flexDirection="column" height={maxVisibleTasks}>
					{visibleTasks.map((task, index) => {
						const actualIndex = startIndex + index;
						const isSelected = actualIndex === selectedIndex;
						const meetsThreshold = task.complexityScore >= reportData.meta.thresholdScore;

						return (
							<Box
								key={task.taskId}
								flexDirection="row"
								paddingX={1}
								backgroundColor={isSelected ? '#3B82F6' : undefined}
							>
								<Box width={6} flexShrink={0}>
									<Text color={isSelected ? 'white' : 'gray'}>
										#{task.taskId}
									</Text>
								</Box>
								<Box width={10} flexShrink={0}>
									<Text
										color={isSelected ? 'white' : getComplexityColor(task.complexityScore)}
										bold={meetsThreshold}
									>
										{task.complexityScore}/10
									</Text>
								</Box>
								<Box width={12} flexShrink={0}>
									<Text
										color={isSelected ? 'white' : getComplexityColor(task.complexityScore)}
									>
										{getComplexityLabel(task.complexityScore)}
									</Text>
								</Box>
								<Box width={10} flexShrink={0}>
									<Text color={isSelected ? 'white' : 'cyan'}>
										+{task.recommendedSubtasks}
									</Text>
								</Box>
								<Box flexGrow={1}>
									<Text
										color={isSelected ? 'white' : meetsThreshold ? 'yellow' : 'white'}
										wrap="truncate"
									>
										{task.taskTitle}
									</Text>
								</Box>
							</Box>
						);
					})}
				</Box>

				{/* Scroll indicators */}
				{totalTasks > maxVisibleTasks && (
					<Box flexDirection="column" flexShrink={0}>
						{startIndex > 0 && (
							<Box justifyContent="center" paddingX={1}>
								<Text color="#EAB308" dimColor>
									⬆ {startIndex} more above ⬆
								</Text>
							</Box>
						)}
						{startIndex + maxVisibleTasks < totalTasks && (
							<Box justifyContent="center" paddingX={1}>
								<Text color="#EAB308" dimColor>
									⬇ {totalTasks - (startIndex + maxVisibleTasks)} more below ⬇
								</Text>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* Selected Task Details */}
			{selectedTask && (
				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					marginTop={1}
					flexShrink={0}
				>
					<Box flexDirection="column">
						<Text bold color="white">
							Task #{selectedTask.taskId}: {selectedTask.taskTitle}
						</Text>
						<Box marginTop={1}>
							<Text color="gray">Reasoning: </Text>
							<Text color="white" wrap="wrap">
								{selectedTask.reasoning}
							</Text>
						</Box>
						<Box marginTop={1}>
							<Text color="gray">Expansion Prompt: </Text>
							<Text color="cyan" wrap="wrap">
								{selectedTask.expansionPrompt}
							</Text>
						</Box>
					</Box>
				</Box>
			)}

			{/* Controls */}
			<Box
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				marginTop={1}
				flexShrink={0}
			>
				<Text color="gray">
					ESC: Back | ↑/↓: Navigate | PgUp/PgDn: Page | Home/End: Jump
				</Text>
			</Box>
		</Box>
	);
}