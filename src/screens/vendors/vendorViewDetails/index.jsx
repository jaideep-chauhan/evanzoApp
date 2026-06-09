// screens/vendorViewDetails/index.jsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import VendorCard from './VendorCard';
import ReviewList from './ReviewList';

const AllReviewsScreen = ({ navigation }) => {
    const route = useRoute();
    // Callers pass either { vendor: {...full object...} } or
    // { vendorId, vendorName } (legacy). We accept both so existing flows
    // keep working while the header gains real data when available.
    const vendor = route.params?.vendor || null;

    return (
        <View style={styles.container}>
            <ScrollView>
                <VendorCard
                    vendor={vendor}
                    onBackPress={() => (navigation && navigation.goBack ? navigation.goBack() : null)}
                    navigation={navigation}
                />
                <ReviewList navigation={navigation} />
            </ScrollView>
        </View>
    );
};

export default AllReviewsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
