import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';

// Toast types with their corresponding colors and icons
const TOAST_TYPES = {
	success: { icon: '✓', color: '#10B981' },
	error: { icon: '✗', color: '#EF4444' },
	warning: { icon: '⚠', color: '#F59E0B' },
	info: { icon: 'ℹ', color: '#3B82F6' }
};

// Maximum number of toasts to keep in memory at once
const MAX_TOASTS = 50;

// Individual Toast component
export function Toast({ 
	id, 
	type = 'info', 
	message, 
	duration = 3000,
	onDismiss,
	isExiting = false 
}) {
	const [opacity, setOpacity] = useState(0);
	const fadeTimeoutRef = useRef(null);
	const dismissTimeoutRef = useRef(null);

	// Handle ESC key for manual dismissal
	useInput((input, key) => {
		if (key.escape) {
			onDismiss(id);
		}
	});

	// Fade in effect
	useEffect(() => {
		// Small delay to ensure the component is mounted before fading in
		const fadeInTimeout = setTimeout(() => {
			setOpacity(1);
		}, 50);

		return () => clearTimeout(fadeInTimeout);
	}, []);

	// Auto-dismiss and fade out
	useEffect(() => {
		if (duration > 0) {
			// Set up auto-dismiss
			dismissTimeoutRef.current = setTimeout(() => {
				onDismiss(id);
			}, duration);
		}

		return () => {
			if (dismissTimeoutRef.current) {
				clearTimeout(dismissTimeoutRef.current);
			}
		};
	}, [id, duration, onDismiss]);

	// Handle exit animation
	useEffect(() => {
		if (isExiting) {
			setOpacity(0);
		}
	}, [isExiting]);

	const { icon, color } = TOAST_TYPES[type] || TOAST_TYPES.info;

	return (
		<Box
			borderStyle="round"
			borderColor={color}
			paddingX={1}
			marginBottom={1}
			width="100%"
			flexDirection="row"
			alignItems="center"
			// Simulate opacity with dimColor
			dimColor={opacity === 0 || isExiting}
		>
			<Text color={color} bold>
				{icon}
			</Text>
			<Text color="white" wrap="wrap">
				{' '}{message}
			</Text>
		</Box>
	);
}

// Toast Container component that manages multiple toasts
export function ToastContainer({ toasts, onDismiss }) {
	// Position at bottom-right by using absolute positioning
	return (
		<Box
			position="absolute"
			bottom={2}
			right={2}
			flexDirection="column"
			minWidth={30}
			maxWidth={50}
		>
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					{...toast}
					onDismiss={onDismiss}
				/>
			))}
		</Box>
	);
}

// Toast Provider component
export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const nextIdRef = useRef(1);

	// Add a new toast
	const addToast = (type, message, duration = 3000) => {
		const id = nextIdRef.current++;
		const newToast = {
			id,
			type,
			message,
			duration,
			isExiting: false
		};

		setToasts(prev => {
			const next = [...prev, newToast];
			// Cull the oldest toasts if we exceed MAX_TOASTS
			if (next.length > MAX_TOASTS) {
				return next.slice(next.length - MAX_TOASTS);
			}
			return next;
		});
		return id;
	};

	// Dismiss a toast with fade out
	const dismissToast = (id) => {
		// First mark as exiting for fade out
		setToasts(prev => 
			prev.map(toast => 
				toast.id === id ? { ...toast, isExiting: true } : toast
			)
		);

		// Then remove after animation
		setTimeout(() => {
			setToasts(prev => prev.filter(toast => toast.id !== id));
		}, 200); // Match fade out duration
	};

	// Clear all toasts
	const clearToasts = () => {
		// Mark all as exiting
		setToasts(prev => 
			prev.map(toast => ({ ...toast, isExiting: true }))
		);

		// Then remove all
		setTimeout(() => {
			setToasts([]);
		}, 200);
	};

	// Create context value
	const contextValue = {
		addToast,
		dismissToast,
		clearToasts,
		// Convenience methods
		success: (message, duration) => addToast('success', message, duration),
		error: (message, duration) => addToast('error', message, duration),
		warning: (message, duration) => addToast('warning', message, duration),
		info: (message, duration) => addToast('info', message, duration)
	};

	return (
		<ToastContext.Provider value={contextValue}>
			<Box position="relative" width="100%" height="100%">
				{children}
				{toasts.length > 0 && (
					<ToastContainer toasts={toasts} onDismiss={dismissToast} />
				)}
			</Box>
		</ToastContext.Provider>
	);
}

// Create the context
const ToastContext = React.createContext(null);

// Hook to use toast functionality
export function useToast() {
	const context = React.useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
}

// Export all components
export default {
	Toast,
	ToastContainer,
	ToastProvider,
	useToast
};