import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import percentage from '../../../assets/icons/percent.png'
import { getCurrencySymbol } from '../../../utils/currency';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards with spacing

const OfferCard = ({ amount = 0, percent = 0, currency = 'USD' }) => {
    // Don't render the card if both amount and percent are 0
    if (amount === 0 && percent === 0) {
        return null;
    }

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.label}></Text>
                <Text style={styles.columnTitle}>Amount spent</Text>
                <Text style={styles.columnTitle}>Discount</Text>
            </View>
            <View style={styles.row}>
                <View style={styles.valueBox1}>
                    <Text style={{ color: "#344562", fontSize: 8 }}>Offer:</Text>
                </View>
                <View style={styles.valueBox}>
                    <Text style={[styles.valueText, { marginLeft: 0, fontWeight: '700' }]}>{getCurrencySymbol(currency)}</Text>
                    <Text style={styles.valueText}>{amount}</Text>
                </View>
                <View style={styles.valueBox}>
                    <Image source={percentage} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
                    <Text style={styles.valueText}>{percent}%</Text>
                </View>
            </View>
        </View>
    );
};

const OfferGrid = ({ offers = [], currency = 'USD' }) => {
    // Filter out offers where both amount and discount are 0
    const validOffers = offers.filter(offer =>
        (offer.amount && offer.amount !== 0) || (offer.discount && offer.discount !== 0)
    );

    // If no valid offers (all are zero), don't render the grid at all
    if (!validOffers || validOffers.length === 0) {
        return null;
    }

    // Render rows of up to 2 offers, sized to actual content. Previously
    // we padded out to a fixed 2×2 with invisible placeholder cards, which
    // reserved height/width for nothing — the grid grew to ~2× its needed
    // size when there was only 1 real offer. Now: a single offer renders
    // as one card, two as a row of two, three as a row plus a half-row of
    // one, four as a full 2×2. No phantom space.
    const renderOfferRows = () => {
        const rows = [];
        const itemsPerRow = 2;
        const offersToShow = validOffers.slice(0, 4);

        for (let i = 0; i < offersToShow.length; i += itemsPerRow) {
            const rowOffers = offersToShow.slice(i, i + itemsPerRow);
            rows.push(
                <View key={i} style={styles.row}>
                    {rowOffers.map((offer, index) => (
                        <OfferCard
                            key={i + index}
                            amount={offer.amount || 0}
                            percent={offer.discount || 0}
                            currency={currency}
                        />
                    ))}
                </View>
            );
        }

        return rows;
    };

    return (
        <View style={styles.gridContainer}>
            {renderOfferRows()}
        </View>
    );
};

export default OfferGrid;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fefefe',
        boxShadow: '1px 1px 4px 0px #00000029',
        borderWidth: 1,
        borderColor: '#eaeaea',
        borderRadius: 12,
    },
    gridContainer: {
        // Tighter padding + lighter shadow so the offer grid hugs its
        // content. Outer padding was 16 (32 vertical) — now 10 (20 vertical),
        // and rows / cards trimmed too. Net result: ~30-40% less height.
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fefefe',
        borderWidth: 1,
        borderColor: '#eaeaea',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        gap: 8,
    },
    card: {
        width: CARD_WIDTH,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    emptyCard: {
        width: CARD_WIDTH,
        paddingVertical: 4,
        paddingHorizontal: 8,
        // Invisible placeholder to maintain grid layout
    },
    columnTitle: {
        flex: 1,
        textAlign: 'right',
        color: '#1e2b4f',
        fontSize: 8,
        fontWeight: '500',
    },
    valueBox: {
        flex: 1,
        backgroundColor: '#F3F7FF',
        borderRadius: 20,
        // 8 → 5: still touchable / legible, just less air.
        paddingVertical: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueBox1: {
        paddingVertical: 5,
    },
    valueText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#2C3D5BF5',
        marginLeft: 6,
    },
});
