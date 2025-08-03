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

const OfferCard = ({ amount = 150, percent = 10 }) => {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.label}></Text>
                <Text style={styles.columnTitle}>Amount spent</Text>
                <Text style={styles.columnTitle}>Percentage</Text>
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

const OfferGrid = () => {
    return (
        <View style={styles.container}>
            <OfferCard />
            <OfferCard />

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
    card: {
        width: CARD_WIDTH,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    columnTitle: {
        flex: 1,
        textAlign: 'right',
        color: '#1e2b4f',
        fontSize: 8,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 4,
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
