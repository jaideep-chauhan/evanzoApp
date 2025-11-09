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
import dollar from '../../../assets/icons/dollar.png';
import percentage from '../../../assets/icons/percent.png'

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards with spacing

const OfferCard = ({ amount = 0, percent = 0 }) => {
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
                    <Image source={dollar} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
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

const OfferGrid = ({ offers = [] }) => {
    // Filter out offers where both amount and discount are 0
    const validOffers = offers.filter(offer =>
        (offer.amount && offer.amount !== 0) || (offer.discount && offer.discount !== 0)
    );

    // If no valid offers (all are zero), don't render the grid at all
    if (!validOffers || validOffers.length === 0) {
        return null;
    }

    // Create rows for 2x2 grid layout
    const renderOfferRows = () => {
        const rows = [];
        const itemsPerRow = 2;

        // Calculate how many offers to show (max 4 for 2x2 grid)
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
                        />
                    ))}
                    {/* Fill empty space if row is not complete */}
                    {rowOffers.length === 1 && <View style={styles.emptyCard} />}
                </View>
            );
        }

        // Fill remaining rows to maintain 2x2 grid structure
        const remainingSlots = 4 - offersToShow.length;
        if (remainingSlots > 0 && rows.length === 1) {
            // If we have 1-3 offers, we need to fill the second row
            const secondRowNeeded = Math.min(remainingSlots, 2);
            if (secondRowNeeded > 0) {
                const emptyCards = [];
                for (let j = 0; j < secondRowNeeded; j++) {
                    emptyCards.push(<View key={`empty-${j}`} style={styles.emptyCard} />);
                }
                rows.push(
                    <View key="empty-row" style={styles.row}>
                        {emptyCards}
                    </View>
                );
            }
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
        padding: 16,
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
        marginBottom: 8,
        gap: 8,
    },
    card: {
        width: CARD_WIDTH,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    emptyCard: {
        width: CARD_WIDTH,
        paddingVertical: 12,
        paddingHorizontal: 12,
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
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueBox1: {
        paddingVertical: 8,
    },
    valueText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#2C3D5BF5',
        marginLeft: 6,
    },
});
