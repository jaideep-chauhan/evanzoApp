import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../ThemeContext';

/**
 * A reusable ScrollView component with pull-to-refresh functionality
 *
 * Usage:
 * <RefreshableScrollView onRefresh={fetchData}>
 *   <YourContent />
 * </RefreshableScrollView>
 *
 * @param {Function} onRefresh - Async function to call when user pulls to refresh
 * @param {Object} refreshControlProps - Additional props to pass to RefreshControl
 * @param {Object} scrollViewProps - Additional props to pass to ScrollView
 * @param {ReactNode} children - Content to render inside the ScrollView
 */
const RefreshableScrollView = ({
    onRefresh,
    refreshControlProps = {},
    children,
    ...scrollViewProps
}) => {
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh) return;

        setRefreshing(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error('Error during refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <ScrollView
            {...scrollViewProps}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]} // Android
                    tintColor={theme.colors.primary} // iOS
                    {...refreshControlProps}
                />
            }
        >
            {children}
        </ScrollView>
    );
};

export default RefreshableScrollView;
