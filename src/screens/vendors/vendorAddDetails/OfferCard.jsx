import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { getCurrencySymbol } from '../../../utils/currency';

const MAX_OFFERS = 4;

// Small dark badge in front of a value: the currency symbol or "%".
const Badge = ({ label }) => (
    <View style={styles.badge}>
        <Text style={styles.badgeText}>{label}</Text>
    </View>
);

// One column of the grid: "Amount spent / Discount" titles, then a row per
// offer. Only the first row carries the "Offer:" label.
const OfferColumn = ({ offers, currency }) => (
    <View style={styles.column}>
        <View style={styles.row}>
            <View style={styles.labelCell} />
            <Text style={styles.columnTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Amount spent</Text>
            <Text style={styles.columnTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Discount</Text>
        </View>
        {offers.map((offer, index) => (
            <View key={index} style={styles.row}>
                <View style={styles.labelCell}>
                    {index === 0 && <Text style={styles.offerLabel}>Offer:</Text>}
                </View>
                <View style={styles.valueBox}>
                    <Badge label={getCurrencySymbol(currency)} />
                    <Text style={styles.valueText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{offer.amount || 0}</Text>
                </View>
                {Number(offer.discount) > 0 ? (
                    <View style={styles.valueBox}>
                        <Badge label="%" />
                        <Text style={styles.valueText} numberOfLines={1}>{Number(offer.discount)}%</Text>
                    </View>
                ) : (
                    <View style={styles.valueSpacer} />
                )}
            </View>
        ))}
    </View>
);

const OfferGrid = ({ offers = [], currency = 'USD' }) => {
    // Filter out offers where both amount and discount are 0
    const validOffers = (offers || []).filter(offer =>
        (offer.amount && offer.amount !== 0) || (offer.discount && offer.discount !== 0)
    ).slice(0, MAX_OFFERS);

    // If no valid offers (all are zero), don't render the grid at all
    if (validOffers.length === 0) {
        return null;
    }

    // Two columns, filled left-to-right then down (1 2 / 3 4), so the first
    // offers stay on the top line. A single offer keeps to the left half.
    const left = validOffers.filter((_, i) => i % 2 === 0);
    const right = validOffers.filter((_, i) => i % 2 === 1);

    return (
        <View style={styles.gridContainer}>
            <OfferColumn offers={left} currency={currency} />
            {right.length > 0 ? (
                <OfferColumn offers={right} currency={currency} />
            ) : (
                <View style={styles.column} />
            )}
        </View>
    );
};

export default OfferGrid;

const styles = StyleSheet.create({
    // Same card treatment as the Description / Links cards above it.
    gridContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 18,
        backgroundColor: '#FCFAFA',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    column: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    labelCell: {
        width: 30,
    },
    offerLabel: {
        color: '#344562',
        fontSize: 10,
    },
    columnTitle: {
        flex: 1,
        textAlign: 'center',
        color: '#1e2b4f',
        fontSize: 9,
        fontWeight: '500',
    },
    valueBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#F3F7FF',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 4,
    },
    // Keeps the amount pill the same width when an offer has no discount
    valueSpacer: {
        flex: 1,
    },
    badge: {
        minWidth: 16,
        height: 16,
        paddingHorizontal: 3,
        borderRadius: 8,
        backgroundColor: '#2C3D5B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
    valueText: {
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3D5B',
    },
});
