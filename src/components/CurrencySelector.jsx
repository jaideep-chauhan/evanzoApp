import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CURRENCIES, getCurrencyMeta } from '../utils/currency';

// Compact currency picker: a pill showing "<symbol> <code> ▾" that opens a
// bottom-sheet list. Used next to budget/offer amount inputs so a multi-country
// user can pick the unit (₹, €, $, ...) their price is in.
const CurrencySelector = ({ value, onChange, style, compact = false }) => {
    const [open, setOpen] = useState(false);
    const meta = getCurrencyMeta(value);

    const handleSelect = (code) => {
        onChange?.(code);
        setOpen(false);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.trigger, compact && styles.triggerCompact, style]}
                onPress={() => setOpen(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.triggerText}>{compact ? meta.symbol : `${meta.symbol} ${meta.code}`}</Text>
                <Icon name="chevron-down" size={16} color="#ffffff" />
            </TouchableOpacity>

            <Modal
                visible={open}
                transparent
                animationType="slide"
                onRequestClose={() => setOpen(false)}
                statusBarTranslucent
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Currency</Text>
                        <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#2C3D5B" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={CURRENCIES}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => {
                            const selected = item.code === meta.code;
                            return (
                                <TouchableOpacity
                                    style={[styles.row, selected && styles.rowSelected]}
                                    onPress={() => handleSelect(item.code)}
                                >
                                    <Text style={styles.rowSymbol}>{item.symbol}</Text>
                                    <View style={styles.rowTextWrap}>
                                        <Text style={styles.rowCode}>{item.code}</Text>
                                        <Text style={styles.rowName}>{item.name}</Text>
                                    </View>
                                    {selected && (
                                        <Icon name="checkmark-circle" size={20} color="#2C3D5B" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#41547A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffffff30',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    triggerCompact: {
        paddingHorizontal: 10,
        gap: 2,
    },
    triggerText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
    backdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 18,
        borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
    },
    title: { fontSize: 18, fontWeight: '700', color: '#2C3D5B' },
    closeBtn: { padding: 4 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    rowSelected: { backgroundColor: '#F0F4FF' },
    rowSymbol: { fontSize: 18, fontWeight: '700', color: '#2C3D5B', width: 44 },
    rowTextWrap: { flex: 1 },
    rowCode: { fontSize: 15, fontWeight: '600', color: '#2C3D5B' },
    rowName: { fontSize: 13, color: '#666', marginTop: 2 },
});

export default CurrencySelector;
