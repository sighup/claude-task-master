import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

// Match exact colors from CLI task-master list command
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

const STATUS_SYMBOLS = {
	done: '✓',
	completed: '✓',
	pending: '○',
	'in-progress': '►',
	blocked: '!',
	review: '?',
	deferred: 'x',
	cancelled: '✗'
};

export function ShowTask({
	task,
	onClose,
	onNavigateTask,
	onUpdateTaskStatus,
	onExit,
	tasks
}) {
	const [selectedSubtaskIndex, setSelectedSubtaskIndex] = useState(-1);
	const [showSubtaskDetail, setShowSubtaskDetail] = useState(false);
	const [detailScrollOffset, setDetailScrollOffset] = useState(0);
	const { stdout } = useStdout();

	// Calculate available height for scrollable content
	const terminalHeight = stdout?.rows || 24;
	const terminalWidth = stdout?.columns || 80;

	if (!task) {
		return (
			<Box padding={1}>
				<Text color="red">No task selected</Text>
			</Box>
		);
	}

	// Dynamic height calculation based on whether task has subtasks
	const hasSubtasks = task.subtasks && task.subtasks.length > 0;
	const fixedSubtaskLines = 5; // Fixed height for subtasks list when present

	// Calculate fixed space usage:
	// Header: 3 lines (border + content + border)
	// Task Details: 5 lines (ID, Title, Status, Priority, Description)
	// Implementation Details Header: 3 lines (border + content + border)
	// Subtasks Header (if present): 3 lines
	// Subtasks Table Header (if present): 1 line
	// Subtask Progress (if present): 5 lines (border + content + border)
	// Suggested Actions: 4 lines (border + title + actions + border)
	// Footer: 3 lines (border + content + border)

	const fixedHeaderLines = 3 + 5; // Header + Task Details
	const fixedFooterLines = 4 + 3; // Suggested Actions + Footer
	const subtaskHeaderLines = hasSubtasks ? 3 + 1 : 0; // Subtasks header + table header
	const subtaskProgressLines = hasSubtasks ? 5 : 0;
	const implementationHeaderLines = 3;

	const totalFixedLines =
		fixedHeaderLines +
		fixedFooterLines +
		subtaskHeaderLines +
		subtaskProgressLines +
		implementationHeaderLines;
	const availableForContent = Math.max(5, terminalHeight - totalFixedLines);

	// Split available space between implementation details and subtasks
	const maxSubtaskLines = hasSubtasks
		? Math.min(fixedSubtaskLines, Math.floor(availableForContent * 0.4))
		: 0;
	const maxDetailLines = Math.max(3, availableForContent - maxSubtaskLines);

	// Reset scroll offset when task changes or terminal resizes
	useEffect(() => {
		setDetailScrollOffset(0);
	}, [task.id, terminalHeight, terminalWidth]);

	// Calculate subtask progress
	const subtaskStats = task.subtasks
		? {
				total: task.subtasks.length,
				done: task.subtasks.filter(
					(s) => s.status === 'done' || s.status === 'completed'
				).length,
				inProgress: task.subtasks.filter((s) => s.status === 'in-progress')
					.length,
				blocked: task.subtasks.filter((s) => s.status === 'blocked').length,
				deferred: task.subtasks.filter((s) => s.status === 'deferred').length,
				cancelled: task.subtasks.filter((s) => s.status === 'cancelled').length,
				pending: task.subtasks.filter((s) => s.status === 'pending').length
			}
		: null;

	const progressPercentage = subtaskStats
		? Math.round((subtaskStats.done / subtaskStats.total) * 100)
		: 0;

	// Get selected subtask
	const selectedSubtask =
		task.subtasks && selectedSubtaskIndex >= 0
			? task.subtasks[selectedSubtaskIndex]
			: null;

	// Split implementation details into lines for scrolling
	const detailLines = task.details ? task.details.split('\n') : [];
	// Trim lines to prevent leading/trailing whitespace issues but preserve indentation
	const visibleDetailLines = detailLines
		.slice(detailScrollOffset, detailScrollOffset + maxDetailLines)
		.map((line) => (line ? line.trimEnd() : ''));

	useInput((input, key) => {
		// Handle Page Up/Down scrolling first (works in both main and subtask views)
		if (key.pageUp || (key.ctrl && input === 'u')) {
			if (showSubtaskDetail && selectedSubtask) {
				// Scroll subtask details
				const subtaskDetailLines = selectedSubtask.details
					? selectedSubtask.details.split('\n')
					: [];
				if (subtaskDetailLines.length > maxDetailLines && detailScrollOffset > 0) {
					setDetailScrollOffset((prev) => Math.max(0, prev - Math.floor(maxDetailLines / 2)));
				}
			} else {
				// Scroll main task implementation details
				if (detailLines.length > maxDetailLines && detailScrollOffset > 0) {
					setDetailScrollOffset((prev) => Math.max(0, prev - Math.floor(maxDetailLines / 2)));
				}
			}
			return;
		}

		if (key.pageDown || (key.ctrl && input === 'd')) {
			if (showSubtaskDetail && selectedSubtask) {
				// Scroll subtask details
				const subtaskDetailLines = selectedSubtask.details
					? selectedSubtask.details.split('\n')
					: [];
				if (subtaskDetailLines.length > maxDetailLines && detailScrollOffset < subtaskDetailLines.length - maxDetailLines) {
					setDetailScrollOffset((prev) => Math.min(subtaskDetailLines.length - maxDetailLines, prev + Math.floor(maxDetailLines / 2)));
				}
			} else {
				// Scroll main task implementation details
				if (detailLines.length > maxDetailLines && detailScrollOffset < detailLines.length - maxDetailLines) {
					setDetailScrollOffset((prev) => Math.min(detailLines.length - maxDetailLines, prev + Math.floor(maxDetailLines / 2)));
				}
			}
			return;
		}

		// Handle subtask detail view inputs
		if (showSubtaskDetail && selectedSubtask) {
			if (key.escape) {
				setShowSubtaskDetail(false);
				return;
			}

			// Handle number keys for suggested actions in subtask view
			if (onUpdateTaskStatus) {
				if (input === '1') {
					const subtaskId = `${task.id}.${selectedSubtask.id}`;
					onUpdateTaskStatus(subtaskId, 'in-progress');
					return;
				}
				if (input === '2') {
					const subtaskId = `${task.id}.${selectedSubtask.id}`;
					onUpdateTaskStatus(subtaskId, 'done');
					return;
				}
			}

			// Navigate between subtasks with left/right arrows
			if (key.leftArrow && task.subtasks && selectedSubtaskIndex > 0) {
				setSelectedSubtaskIndex((prev) => prev - 1);
				setDetailScrollOffset(0); // Reset scroll when changing subtask
				return;
			}
			if (
				key.rightArrow &&
				task.subtasks &&
				selectedSubtaskIndex < task.subtasks.length - 1
			) {
				setSelectedSubtaskIndex((prev) => prev + 1);
				setDetailScrollOffset(0); // Reset scroll when changing subtask
				return;
			}

			// Scroll through subtask details if needed
			const subtaskDetailLines = selectedSubtask.details
				? selectedSubtask.details.split('\n')
				: [];
			if (key.upArrow && detailScrollOffset > 0) {
				setDetailScrollOffset((prev) => Math.max(0, prev - 1));
			}
			if (
				key.downArrow &&
				subtaskDetailLines.length > maxDetailLines &&
				detailScrollOffset < subtaskDetailLines.length - maxDetailLines
			) {
				setDetailScrollOffset((prev) => prev + 1);
			}
			return;
		}

		// Exit show task view
		if (key.escape) {
			onClose();
			return;
		}

		// Q key should exit the entire app, not just close task detail
		if (input === 'q') {
			if (onExit) {
				onExit();
			} else {
				onClose(); // Fallback to closing task detail
			}
			return;
		}

		// Navigate subtasks with arrow keys
		if (task.subtasks && task.subtasks.length > 0) {
			if (key.upArrow) {
				if (selectedSubtaskIndex === -1) {
					setSelectedSubtaskIndex(task.subtasks.length - 1);
				} else {
					setSelectedSubtaskIndex((prev) => Math.max(0, prev - 1));
				}
				return;
			}
			if (key.downArrow) {
				if (selectedSubtaskIndex === -1) {
					setSelectedSubtaskIndex(0);
				} else {
					setSelectedSubtaskIndex((prev) =>
						Math.min(task.subtasks.length - 1, prev + 1)
					);
				}
				return;
			}
		}

		// Navigate between tasks with left/right arrows
		if (key.leftArrow && onNavigateTask) {
			onNavigateTask('prev');
			return;
		}
		if (key.rightArrow && onNavigateTask) {
			onNavigateTask('next');
			return;
		}

		// Show subtask detail with S key
		if (input === 's' && selectedSubtask) {
			setShowSubtaskDetail(true);
			setDetailScrollOffset(0);
			return;
		}

		// Handle number keys for suggested actions
		if (onUpdateTaskStatus) {
			if (input === '1') {
				onUpdateTaskStatus(String(task.id), 'in-progress');
				onClose(); // Close the detail view after updating
				return;
			}
			if (input === '2') {
				onUpdateTaskStatus(String(task.id), 'done');
				onClose(); // Close the detail view after updating
				return;
			}
			if (input === '3' && selectedSubtask && onUpdateTaskStatus) {
				try {
					// Format: "taskId.subtaskId" as a string
					const subtaskId = `${task.id}.${selectedSubtask.id}`;
					onUpdateTaskStatus(subtaskId, 'in-progress');
				} catch (err) {
					console.error('Error updating subtask status:', err);
				}
				return;
			}
			if (input === '4' && selectedSubtask && onUpdateTaskStatus) {
				try {
					// Format: "taskId.subtaskId" as a string
					const subtaskId = `${task.id}.${selectedSubtask.id}`;
					onUpdateTaskStatus(subtaskId, 'done');
				} catch (err) {
					console.error('Error updating subtask status:', err);
				}
				return;
			}
		}

	});

	// Show subtask detail view
	if (showSubtaskDetail && selectedSubtask) {
		// Split subtask details into lines for scrolling
		const subtaskDetailLines = selectedSubtask.details
			? selectedSubtask.details.split('\n')
			: [];
		const visibleSubtaskDetailLines = subtaskDetailLines.slice(
			detailScrollOffset,
			detailScrollOffset + maxDetailLines
		);

		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				overflow="hidden"
			>
				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					width="100%"
					flexShrink={0}
				>
					<Text bold color="white">
						Subtask: {task.id}.{selectedSubtask.id} - {selectedSubtask.title}
					</Text>
				</Box>

				<Box flexDirection="column" paddingX={1} flexShrink={0}>
					<Text color="gray">
						Status:{' '}
						<Text color={STATUS_COLORS[selectedSubtask.status] || 'white'}>
							{STATUS_SYMBOLS[selectedSubtask.status] || '?'}{' '}
							{selectedSubtask.status}
						</Text>
					</Text>
					{selectedSubtask.description && (
						<Text color="gray">
							Description:{' '}
							<Text color="white">{selectedSubtask.description}</Text>
						</Text>
					)}
					{selectedSubtask.dependencies &&
						selectedSubtask.dependencies.length > 0 && (
							<Text color="gray">
								Dependencies:{' '}
								<Text color="#F59E0B">
									{selectedSubtask.dependencies.join(', ')}
								</Text>
							</Text>
						)}
				</Box>

				{/* Subtask Implementation Details */}
				{selectedSubtask.details && (
					<>
						<Box
							borderStyle="single"
							borderColor="gray"
							paddingX={1}
							flexShrink={0}
						>
							<Text bold color="white">
								Implementation Details:
							</Text>
							{subtaskDetailLines.length > maxDetailLines && (
								<Text color="gray">
									{' '}
									(Lines {detailScrollOffset + 1}-
									{Math.min(
										detailScrollOffset + maxDetailLines,
										subtaskDetailLines.length
									)}{' '}
									of {subtaskDetailLines.length})
								</Text>
							)}
						</Box>
						<Box height={maxDetailLines} overflow="hidden" flexGrow={1}>
							<Box flexDirection="column">
								{visibleSubtaskDetailLines.map((line, i) => (
									<Box key={detailScrollOffset + i} paddingLeft={1}>
										<Text color="white" wrap="wrap">
											{line || ' '}
										</Text>
									</Box>
								))}
							</Box>
						</Box>
					</>
				)}

				<Box flexGrow={1} />

				{/* Suggested Actions for Subtask */}
				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					flexShrink={0}
				>
					<Text bold color="white">
						Suggested Actions:
					</Text>
					<Box flexDirection="row">
						<Text color="gray">[1] Mark as in-progress </Text>
						<Text color="gray">[2] Mark as done</Text>
					</Box>
				</Box>

				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					flexShrink={0}
				>
					<Text color="gray">
						ESC: Return to task | Q: Exit | ←/→: Navigate subtasks | ↑/↓: Scroll
					</Text>
				</Box>
			</Box>
		);
	}

	// Calculate if we need to show scrollable sections
	const showScrollableDetails = detailLines.length > 0;
	const subtasksCount = task.subtasks ? task.subtasks.length : 0;

	// Calculate visible subtasks window based on selected index
	const calculateVisibleSubtasks = () => {
		if (!task.subtasks || task.subtasks.length === 0) return [];

		// If all subtasks fit, show all
		if (task.subtasks.length <= maxSubtaskLines) {
			return task.subtasks;
		}

		// Calculate window to keep selected subtask visible
		let startIdx = 0;
		if (selectedSubtaskIndex >= 0) {
			// Center the selected subtask in the visible window
			startIdx = Math.max(
				0,
				selectedSubtaskIndex - Math.floor(maxSubtaskLines / 2)
			);
			// Adjust if we're near the end
			if (startIdx + maxSubtaskLines > task.subtasks.length) {
				startIdx = Math.max(0, task.subtasks.length - maxSubtaskLines);
			}
		}

		return task.subtasks.slice(startIdx, startIdx + maxSubtaskLines);
	};

	const visibleSubtasks = calculateVisibleSubtasks();
	const subtaskWindowStart =
		task.subtasks && selectedSubtaskIndex >= 0
			? Math.max(
					0,
					Math.min(
						selectedSubtaskIndex - Math.floor(maxSubtaskLines / 2),
						task.subtasks.length - maxSubtaskLines
					)
				)
			: 0;

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={terminalHeight}
			overflow="hidden"
		>
			{/* Header - Fixed height */}
			<Box
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				width="100%"
				flexShrink={0}
			>
				<Text bold color="white">
					Task: {task.id} - {task.title}
				</Text>
			</Box>

			{/* Task Details Section - Fixed height */}
			<Box flexDirection="column" paddingX={1} flexShrink={0}>
				<Text color="gray">
					ID: <Text color="white">{task.id}</Text>
				</Text>
				<Text color="gray">
					Title: <Text color="white">{task.title}</Text>
				</Text>
				<Text color="gray">
					Status:{' '}
					<Text color={STATUS_COLORS[task.status] || 'white'}>
						{STATUS_SYMBOLS[task.status] || '?'} {task.status}
					</Text>
				</Text>
				<Text color="gray">
					Priority:{' '}
					<Text
						color={
							task.priority === 'high'
								? '#EF4444'
								: task.priority === 'medium'
									? '#EAB308'
									: '#6B7280'
						}
					>
						{task.priority}
					</Text>
					{task.dependencies && task.dependencies.length > 0 && (
						<Text color="gray">
							{' '}
							Dependencies:{' '}
							<Text color="#F59E0B">{task.dependencies.join(', ')}</Text>
						</Text>
					)}
				</Text>
				<Text color="gray">
					Description:{' '}
					<Text color="white" wrap="wrap">
						{task.description || 'No description'}
					</Text>
				</Text>
			</Box>

			{/* Scrollable content area - Implementation Details only */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				{/* Implementation Details Section with scrolling */}
				{showScrollableDetails && (
					<>
						<Box
							borderStyle="single"
							borderColor="gray"
							paddingX={1}
							flexShrink={0}
						>
							<Text bold color="white">
								Implementation Details:
							</Text>
							{detailLines.length > maxDetailLines && (
								<Text color="gray">
									{' '}
									(Lines {detailScrollOffset + 1}-
									{Math.min(
										detailScrollOffset + maxDetailLines,
										detailLines.length
									)}{' '}
									of {detailLines.length}, PgUp/PgDn)
								</Text>
							)}
						</Box>
						<Box height={maxDetailLines} flexGrow={1} overflow="hidden">
							<Box flexDirection="column">
								{visibleDetailLines.map((line, i) => (
									<Box key={detailScrollOffset + i} paddingLeft={1}>
										<Text color="white" wrap="wrap">
											{line || ' '}
										</Text>
									</Box>
								))}
								{/* Fill remaining space with empty lines if needed */}
								{Array.from(
									{
										length: Math.max(
											0,
											maxDetailLines - visibleDetailLines.length
										)
									},
									(_, i) => (
										<Text key={`empty-${i}`}> </Text>
									)
								)}
							</Box>
						</Box>
					</>
				)}
			</Box>

			{/* Bottom sections - Fixed height */}
			<Box flexDirection="column" flexShrink={0} width="100%">
				{/* Subtasks Section - moved to bottom */}
				{subtasksCount > 0 && (
					<>
						<Box
							borderStyle="single"
							borderColor="gray"
							paddingX={1}
							flexShrink={0}
						>
							<Text bold color="white">
								Subtasks
							</Text>
						</Box>

						{/* Subtasks Table Header */}
						<Box flexDirection="row" paddingX={2} flexShrink={0}>
							<Box width={8} flexShrink={0}>
								<Text bold color="gray">
									ID
								</Text>
							</Box>
							<Box width={15} flexShrink={0}>
								<Text bold color="gray">
									Status
								</Text>
							</Box>
							<Box flexGrow={1}>
								<Text bold color="gray">
									Title
								</Text>
							</Box>
							<Box flexShrink={0}>
								<Text bold color="gray">
									Deps
								</Text>
							</Box>
						</Box>

						{/* Subtasks Table Body - Dynamic height based on actual subtasks */}
						<Box
							flexDirection="column"
							height={Math.min(task.subtasks.length, maxSubtaskLines)}
							overflow="hidden"
						>
							{visibleSubtasks.map((subtask, visibleIndex) => {
								// Calculate the actual index in the full subtask array
								const actualIndex = subtaskWindowStart + visibleIndex;
								const isSelected = actualIndex === selectedSubtaskIndex;

								return (
									<Box
										key={subtask.id}
										flexDirection="row"
										paddingX={2}
										backgroundColor={isSelected ? '#1E40AF' : undefined}
									>
										<Box width={8} flexShrink={0}>
											<Text color={isSelected ? '#FFFFFF' : 'white'}>
												{task.id}.{subtask.id}
											</Text>
										</Box>
										<Box width={15} flexShrink={0}>
											<Text
												color={
													isSelected
														? '#FFFFFF'
														: STATUS_COLORS[subtask.status] || 'white'
												}
											>
												{STATUS_SYMBOLS[subtask.status] || '?'} {subtask.status}
											</Text>
										</Box>
										<Box flexGrow={1} marginRight={2}>
											<Text
												color={
													isSelected
														? '#FFFFFF'
														: subtask.status === 'done' ||
																subtask.status === 'completed'
															? '#10B981'
															: 'white'
												}
											>
												{subtask.title}
											</Text>
										</Box>
										<Box flexShrink={0}>
											<Text color={isSelected ? '#D1D5DB' : 'gray'}>
												{subtask.dependencies && subtask.dependencies.length > 0
													? subtask.dependencies.join(', ')
													: 'None'}
											</Text>
										</Box>
									</Box>
								);
							})}
						</Box>

						{/* Scroll indicator - more below (always takes space) */}
						{subtasksCount > maxSubtaskLines &&
						subtaskWindowStart + maxSubtaskLines < subtasksCount ? (
							<Box justifyContent="center" paddingX={1} flexShrink={0}>
								<Text color="#EAB308" dimColor>
									⬇ {subtasksCount - (subtaskWindowStart + maxSubtaskLines)}{' '}
									more below ⬇
								</Text>
							</Box>
						) : (
							<Box paddingX={1} flexShrink={0}>
								<Text> </Text>
							</Box>
						)}
					</>
				)}

				{/* Subtask Progress - Only show if subtasks exist */}
				{subtaskStats && subtaskStats.total > 0 && (
					<Box
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
						width="100%"
					>
						<Box flexDirection="column" width="100%">
							<Box
								flexDirection="row"
								width="100%"
								justifyContent="space-between"
							>
								<Box>
									<Text bold color="white">
										Subtask Progress:{' '}
									</Text>
									<Text color="#10B981">
										Completed: {subtaskStats.done}/{subtaskStats.total} (
										{progressPercentage}%)
									</Text>
								</Box>
								<Text color="gray">Progress:</Text>
							</Box>
							<Box
								flexDirection="row"
								width="100%"
								justifyContent="space-between"
							>
								<Box flexDirection="column">
									<Box flexDirection="row" flexWrap="wrap">
										<Text color="#10B981">✓ Done: {subtaskStats.done}</Text>
										<Text color="#FFA500">
											{' '}
											► In Progress: {subtaskStats.inProgress}
										</Text>
										<Text color="#EAB308">
											{' '}
											○ Pending: {subtaskStats.pending}
										</Text>
									</Box>
									<Box flexDirection="row" flexWrap="wrap">
										<Text color="#EF4444">
											! Blocked: {subtaskStats.blocked}
										</Text>
										<Text color="#6B7280">
											{' '}
											⏸ Deferred: {subtaskStats.deferred}
										</Text>
										<Text color="#6B7280">
											{' '}
											✗ Cancelled: {subtaskStats.cancelled}
										</Text>
									</Box>
								</Box>
								<Box>
									<Text color="#10B981">
										{'█'.repeat(Math.floor((progressPercentage / 100) * 20))}
									</Text>
									<Text color="gray">
										{'░'.repeat(
											20 - Math.floor((progressPercentage / 100) * 20)
										)}
									</Text>
									<Text color="white"> {progressPercentage}%</Text>
								</Box>
							</Box>
						</Box>
					</Box>
				)}

				{/* Suggested Actions */}
				<Box borderStyle="single" borderColor="gray" paddingX={1} width="100%">
					<Text bold color="white">
						Suggested Actions:
					</Text>
					<Box flexDirection="row">
						<Text color="gray">[1] Mark as in-progress </Text>
						<Text color="gray">[2] Mark as done </Text>
						{selectedSubtask && (
							<>
								<Text color="gray">[3] Subtask: in-progress </Text>
								<Text color="gray">[4] Subtask: done</Text>
							</>
						)}
					</Box>
				</Box>

				{/* Footer */}
				<Box borderStyle="single" borderColor="gray" paddingX={1} width="100%">
					<Text color="gray">
						ESC: Back | Q: Exit | ↑/↓: Select subtask | ←/→: Navigate tasks
						{selectedSubtask && <Text color="yellow"> | S: Show subtask</Text>}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
