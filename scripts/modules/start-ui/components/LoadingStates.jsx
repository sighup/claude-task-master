import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

// Base skeleton line component with pulsing animation
export function SkeletonLine({ width = '100%', height = 1, delay = 0 }) {
	const [opacity, setOpacity] = useState(0.3);

	useEffect(() => {
		const interval = setInterval(() => {
			setOpacity((prev) => (prev === 0.3 ? 0.7 : 0.3));
		}, 1000 + delay * 100);

		return () => clearInterval(interval);
	}, [delay]);

	return (
		<Box width={width} height={height}>
			<Text color="gray" dimColor>
				{'░'.repeat(typeof width === 'number' ? width : 40)}
			</Text>
		</Box>
	);
}

// Box skeleton for cards/containers
export function SkeletonBox({ width = 20, height = 3, delay = 0 }) {
	const [opacity, setOpacity] = useState(0.3);

	useEffect(() => {
		const interval = setInterval(() => {
			setOpacity((prev) => (prev === 0.3 ? 0.7 : 0.3));
		}, 1000 + delay * 100);

		return () => clearInterval(interval);
	}, [delay]);

	return (
		<Box
			width={width}
			height={height}
			borderStyle="single"
			borderColor={opacity < 0.5 ? '#6B7280' : '#9CA3AF'}
			flexDirection="column"
			padding={1}
		>
			{Array.from({ length: height - 2 }, (_, i) => (
				<Text key={i} dimColor={opacity < 0.5}>
					{'░'.repeat(width - 4)}
				</Text>
			))}
		</Box>
	);
}

// Task list skeleton placeholder
export function TaskListSkeleton({ itemCount = 5 }) {
	return (
		<Box flexDirection="column" width="100%">
			<Box borderStyle="single" borderColor="#6B7280" paddingX={1} marginBottom={1}>
				<Text color="#6B7280">Loading tasks...</Text>
			</Box>
			{Array.from({ length: itemCount }, (_, i) => (
				<Box key={i} paddingX={1} marginBottom={1}>
					<Text color="gray" dimColor>
						{'[  ] ' + '░'.repeat(30)}
					</Text>
				</Box>
			))}
		</Box>
	);
}

// Modal skeleton for loading modal content
export function ModalSkeleton({ title = 'Loading...', width = 60, height = 20 }) {
	return (
		<Box
			borderStyle="double"
			borderColor="#3B82F6"
			width={width}
			height={height}
			flexDirection="column"
			paddingX={2}
			paddingY={1}
		>
			{/* Modal header */}
			<Box marginBottom={1} borderBottom borderColor="#6B7280">
				<Text color="#3B82F6" bold>
					{title}
				</Text>
			</Box>

			{/* Modal content skeleton */}
			<Box flexDirection="column" gap={1}>
				<SkeletonLine width={width - 6} delay={0} />
				<SkeletonLine width={width - 10} delay={1} />
				<Box height={1} />
				<SkeletonLine width={width - 8} delay={2} />
				<SkeletonLine width={width - 12} delay={3} />
				<SkeletonLine width={width - 6} delay={4} />
				<Box height={1} />
				<SkeletonBox width={20} height={3} delay={5} />
			</Box>
		</Box>
	);
}

// Full-screen loading overlay
export function LoadingOverlay({ message = 'Loading...', showSpinner = true }) {
	const [spinnerFrame, setSpinnerFrame] = useState(0);
	const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

	useEffect(() => {
		if (!showSpinner) return;

		const interval = setInterval(() => {
			setSpinnerFrame((prev) => (prev + 1) % spinnerFrames.length);
		}, 80);

		return () => clearInterval(interval);
	}, [showSpinner, spinnerFrames.length]);

	return (
		<Box
			width="100%"
			height="100%"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
		>
			<Box
				borderStyle="round"
				borderColor="#3B82F6"
				paddingX={3}
				paddingY={1}
			>
				<Box flexDirection="row" gap={1}>
					{showSpinner && (
						<Text color="#3B82F6">{spinnerFrames[spinnerFrame]}</Text>
					)}
					<Text color="white">{message}</Text>
				</Box>
			</Box>
		</Box>
	);
}

// Skeleton for subtask items
export function SubtaskSkeleton({ count = 3, parentId = 1 }) {
	return (
		<Box flexDirection="column" paddingLeft={2}>
			{Array.from({ length: count }, (_, i) => (
				<Box key={i} paddingX={1} flexDirection="row" gap={1}>
					<Text color="#6B7280">{i === count - 1 ? '└─' : '├─'}</Text>
					<SkeletonLine width={20} delay={i} />
				</Box>
			))}
		</Box>
	);
}

// Progress bar skeleton
export function ProgressSkeleton({ width = 30 }) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => (prev + 10) % 100);
		}, 200);

		return () => clearInterval(interval);
	}, []);

	const filled = Math.floor((progress / 100) * width);
	const empty = width - filled;

	return (
		<Box flexDirection="row">
			<Text color="#10B981">{'█'.repeat(filled)}</Text>
			<Text color="#6B7280">{'░'.repeat(empty)}</Text>
			<Text color="#6B7280"> {progress}%</Text>
		</Box>
	);
}

// Delayed loading skeleton that only shows after a delay
export function DelayedLoadingSkeleton(props) {
	const [showSkeleton, setShowSkeleton] = useState(false);

	useEffect(() => {
		// Set up timeout to show skeleton after 200ms
		const timeoutId = setTimeout(() => {
			setShowSkeleton(true);
		}, 200);

		// Clear timeout on unmount
		return () => clearTimeout(timeoutId);
	}, []);

	// Return null if skeleton shouldn't be shown yet
	if (!showSkeleton) {
		return null;
	}

	// Return TaskListSkeleton with all props
	return <TaskListSkeleton {...props} />;
}

// Combined loading state component
export function LoadingStates({
	type = 'taskList',
	...props
}) {
	switch (type) {
		case 'taskList':
			return <TaskListSkeleton {...props} />;
		case 'modal':
			return <ModalSkeleton {...props} />;
		case 'overlay':
			return <LoadingOverlay {...props} />;
		case 'line':
			return <SkeletonLine {...props} />;
		case 'box':
			return <SkeletonBox {...props} />;
		case 'subtasks':
			return <SubtaskSkeleton {...props} />;
		case 'progress':
			return <ProgressSkeleton {...props} />;
		default:
			return <TaskListSkeleton {...props} />;
	}
}