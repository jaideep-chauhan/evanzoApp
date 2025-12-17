import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useTheme } from '../../ThemeContext';

export default function DateRangePickerModal({ visible, onClose, onDateRangeSelect, currentDateRange }) {
    const theme = useTheme();
    const [startDate, setStartDate] = useState(currentDateRange?.startDate || new Date());
    const [endDate, setEndDate] = useState(currentDateRange?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleApply = () => {
        if (startDate > endDate) {
            Alert.alert(
                'Invalid Date Range',
                'Start date cannot be after end date. Please select a valid range.',
                [{ text: 'OK' }]
            );
            return;
        }

        onDateRangeSelect({
            startDate,
            endDate,
        });
        onClose();
    };

    const handleClear = () => {
        onDateRangeSelect(null);
        onClose();
    };

    const getDateRangeText = () => {
        if (currentDateRange) {
            return `${formatDate(currentDateRange.startDate)} - ${formatDate(currentDateRange.endDate)}`;
        }
        return 'No date range selected';
    };

    const setQuickRange = (days) => {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        setStartDate(today);
        setEndDate(futureDate);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.container, styles.safeAreaPad]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                            <Icon name="close" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Select Date Range</Text>
                        <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
                            <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Current Selection */}
                    <View style={[styles.currentSelection, { backgroundColor: theme.colors.primary + '10' }]}>
                        <Text style={styles.currentSelectionLabel}>Current Selection:</Text>
                        <Text style={[styles.currentSelectionText, { color: theme.colors.primary }]}>{getDateRangeText()}</Text>
                    </View>

                    {/* Quick Range Options */}
                    <View style={styles.quickRanges}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Quick Ranges</Text>
                        <View style={styles.quickRangeButtons}>
                            <TouchableOpacity
                                style={[styles.quickRangeBtn, { borderColor: theme.colors.primary + '33', backgroundColor: theme.colors.primary + '10' }]}
                                onPress={() => setQuickRange(7)}
                            >
                                <Text style={[styles.quickRangeText, { color: theme.colors.primary }]}>Next 7 Days</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickRangeBtn, { borderColor: theme.colors.primary + '33', backgroundColor: theme.colors.primary + '10' }]}
                                onPress={() => setQuickRange(14)}
                            >
                                <Text style={[styles.quickRangeText, { color: theme.colors.primary }]}>Next 2 Weeks</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickRangeBtn, { borderColor: theme.colors.primary + '33', backgroundColor: theme.colors.primary + '10' }]}
                                onPress={() => setQuickRange(30)}
                            >
                                <Text style={[styles.quickRangeText, { color: theme.colors.primary }]}>Next Month</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Selectors */}
                    <View style={styles.dateSelectors}>
                        {/* Start Date */}
                        <View style={styles.dateSelector}>
                            <Text style={[styles.dateSelectorLabel, { color: theme.colors.primary }]}>Start Date</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { borderColor: theme.colors.primary + '33' }]}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
                                <Text style={[styles.dateButtonText, { color: theme.colors.primary }]}>{formatDate(startDate)}</Text>
                                <Icon name="chevron-down" size={14} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* End Date */}
                        <View style={styles.dateSelector}>
                            <Text style={[styles.dateSelectorLabel, { color: theme.colors.primary }]}>End Date</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { borderColor: theme.colors.primary + '33' }]}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
                                <Text style={[styles.dateButtonText, { color: theme.colors.primary }]}>{formatDate(endDate)}</Text>
                                <Icon name="chevron-down" size={14} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Apply Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.colors.primary }]} onPress={handleApply}>
                            <Text style={styles.applyButtonText}>Apply Date Range</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Date Pickers */}
                    <DatePicker
                        modal
                        open={showStartPicker}
                        date={startDate}
                        mode="date"
                        minimumDate={new Date()}
                        onConfirm={(date) => {
                            setShowStartPicker(false);
                            setStartDate(date);
                        }}
                        onCancel={() => {
                            setShowStartPicker(false);
                        }}
                        textColor={theme.colors.primary}
                    />

                    <DatePicker
                        modal
                        open={showEndPicker}
                        date={endDate}
                        mode="date"
                        minimumDate={startDate}
                        onConfirm={(date) => {
                            setShowEndPicker(false);
                            setEndDate(date);
                        }}
                        onCancel={() => {
                            setShowEndPicker(false);
                        }}
                        textColor={theme.colors.primary}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeAreaPad: {
        paddingTop: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    headerBtn: {
        padding: 6,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    currentSelection: {
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentSelectionLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
    },
    currentSelectionText: {
        fontSize: 15,
        fontWeight: '600',
    },
    quickRanges: {
        marginHorizontal: 16,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    quickRangeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    quickRangeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        marginRight: 6,
        marginBottom: 6,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    quickRangeText: {
        fontWeight: '600',
        fontSize: 12,
    },
    dateSelectors: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    dateSelector: {
        marginBottom: 16,
    },
    dateSelectorLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 2,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        marginTop: 'auto',
    },
    applyButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
