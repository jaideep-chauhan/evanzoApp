// screens/vendorViewDetails/index.jsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import VendorCard from './VendorCard';
import ReviewList from './ReviewList';

const AllReviewsScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <ScrollView>
                {/* <Header navigation={navigation} /> */}
                <VendorCard 
                onBackPress={() => navigation && navigation.goBack ? navigation.goBack() : null}
                navigation={navigation}/>
                <ReviewList navigation={navigation}/>
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
