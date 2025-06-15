import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

// Status colors matching the existing color scheme
const STATUS_COLORS = {
	success: '#10B981', // green
	warning: '#EAB308', // yellow
	error: '#EF4444', // red
	info: '#3B82F6', // blue
	default: '#6B7280' // gray
};

/**
 * Progress Indicator component for showing progress of long-running operations
 * @param {Object} props - Component props
 * @param {string} [props.type='linear'] - Progress indicator type: 'linear', 'spinner', 'steps'
 * @param {number} [props.value=0] - Current progress value (0-100 for percentage, or current step number)
 * @param {number} [props.total=100] - Total value (100 for percentage, or total steps)
 * @param {string} [props.label] - Main label text
 * @param {string} [props.sublabel] - Secondary label text
 * @param {string} [props.status='default'] - Status for color: 'success', 'warning', 'error', 'info', 'default'
 * @param {boolean} [props.indeterminate=false] - Whether progress is indeterminate
 * @param {boolean} [props.showPercentage=true] - Whether to show percentage (for linear type)
 * @param {boolean} [props.animate=true] - Whether to animate progress changes
 * @returns {React.Component} The progress indicator component
 */
export function ProgressIndicator({
	type = 'linear',
	value = 0,
	total = 100,
	label,
	sublabel,
	status = 'default',
	indeterminate = false,
	showPercentage = true,
	animate = true
}) {
	const color = STATUS_COLORS[status] || STATUS_COLORS.default;
	const percentage = Math.min(100, Math.max(0, (value / total) * 100));

	// Animation state for smooth transitions
	const [displayValue, setDisplayValue] = useState(indeterminate ? 0 : value);
	const [spinnerFrame, setSpinnerFrame] = useState(0);
	const [indeterminatePosition, setIndeterminatePosition] = useState(0);

	// Smooth animation for value changes
	useEffect(() => {
		if (!indeterminate && animate && displayValue !== value) {
			const diff = value - displayValue;
			const step = diff / 10;
			const timer = setTimeout(() => {
				setDisplayValue((prev) => {
					const next = prev + step;
					return Math.abs(next - value) < Math.abs(step)
						? value
						: next;
				});
			}, 30);
			return () => clearTimeout(timer);
		} else if (!indeterminate) {
			setDisplayValue(value);
		}
	}, [value, displayValue, animate, indeterminate]);

	// Spinner animation
	useEffect(() => {
		if (type === 'spinner') {
			const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
			const timer = setInterval(() => {
				setSpinnerFrame((prev) => (prev + 1) % frames.length);
			}, 80);
			return () => clearInterval(timer);
		}
	}, [type]);

	// Indeterminate animation
	useEffect(() => {
		if (indeterminate && type === 'linear') {
			const timer = setInterval(() => {
				setIndeterminatePosition((prev) => (prev + 1) % 40);
			}, 50);
			return () => clearInterval(timer);
		}
	}, [indeterminate, type]);

	// Render linear progress bar
	const renderLinearProgress = () => {
		const barWidth = 40;
		const displayPercentage = Math.round((displayValue / total) * 100);

		if (indeterminate) {
			// Indeterminate progress with moving indicator
			const bar = Array(barWidth)
				.fill('░')
				.map((char, i) => {
					const pos = indeterminatePosition;
					if (i >= pos && i < pos + 8) {
						return '█';
					}
					return char;
				})
				.join('');

			return (
				<Box flexDirection="column">
					{label && <Text color={color}>{label}</Text>}
					<Box>
						<Text color={color}>[{bar}]</Text>
					</Box>
					{sublabel && <Text color="gray">{sublabel}</Text>}
				</Box>
			);
		}

		// Determinate progress bar
		const filled = Math.round((displayPercentage / 100) * barWidth);
		const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

		return (
			<Box flexDirection="column">
				{label && <Text color={color}>{label}</Text>}
				<Box flexDirection="row">
					<Text color={color}>[{bar}]</Text>
					{showPercentage && (
						<Text color={color}> {displayPercentage}%</Text>
					)}
				</Box>
				{sublabel && <Text color="gray">{sublabel}</Text>}
			</Box>
		);
	};

	// Render spinner
	const renderSpinner = () => {
		const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
		const currentFrame = frames[spinnerFrame];

		return (
			<Box flexDirection="row">
				<Text color={color}>{currentFrame} </Text>
				{label && <Text color={color}>{label}</Text>}
				{!indeterminate && showPercentage && (
					<Text color="gray"> ({Math.round(percentage)}%)</Text>
				)}
			</Box>
		);
	};

	// Render step-based progress
	const renderStepsProgress = () => {
		const currentStep = Math.round(displayValue);
		const totalSteps = Math.round(total);

		return (
			<Box flexDirection="column">
				{label && <Text color={color}>{label}</Text>}
				<Box flexDirection="row">
					<Text color={color} bold>
						Step {currentStep} of {totalSteps}
					</Text>
					{showPercentage && (
						<Text color="gray"> ({Math.round(percentage)}%)</Text>
					)}
				</Box>
				{sublabel && <Text color="gray">{sublabel}</Text>}
			</Box>
		);
	};

	// Render based on type
	switch (type) {
		case 'spinner':
			return renderSpinner();
		case 'steps':
			return renderStepsProgress();
		case 'linear':
		default:
			return renderLinearProgress();
	}
}

// Convenience components for specific use cases
export function LoadingSpinner({ message, status = 'default' }) {
	return (
		<ProgressIndicator
			type="spinner"
			label={message}
			status={status}
			indeterminate
		/>
	);
}

export function StepProgress({ currentStep, totalSteps, label, sublabel, status = 'default' }) {
	return (
		<ProgressIndicator
			type="steps"
			value={currentStep}
			total={totalSteps}
			label={label}
			sublabel={sublabel}
			status={status}
		/>
	);
}

export function ProgressBar({ value, total = 100, label, sublabel, status = 'default', indeterminate = false }) {
	return (
		<ProgressIndicator
			type="linear"
			value={value}
			total={total}
			label={label}
			sublabel={sublabel}
			status={status}
			indeterminate={indeterminate}
		/>
	);
}