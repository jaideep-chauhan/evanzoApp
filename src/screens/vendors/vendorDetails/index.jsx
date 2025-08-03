import React from 'react'
import VendorProfileCard from './VendorProfileCard';
// Removed SafeAreaView
import { ScrollView, StyleSheet, View } from 'react-native';
import img from '../../../assets/images/dummy.png';
import VendorDetailsSection from './VendorDetailsSection';
import OfferGrid from './OfferCard';

const dummyReviews = [
    {
        id: 1,
        user: 'Alice',
        rating: 5,
        comment: 'Amazing service and beautiful photos!',
        date: '2024-07-01',
    },
    {
        id: 2,
        user: 'Bob',
        rating: 4,
        comment: 'Very professional and friendly.',
        date: '2024-06-28',
    },
    {
        id: 3,
        user: 'Charlie',
        rating: 5,
        comment: 'Highly recommended for any event.',
        date: '2024-06-15',
    },
];


export default function VendorChat({ navigation }) {
    return (
        <View style={styles.safe}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <VendorProfileCard
                    logo={img}
                    name="4x90 Studio"
                    category="Photography"
                    location="Ontario, Canada"
                    onBackPress={() => navigation && navigation.goBack ? navigation.goBack() : null}
                    onBellPress={() => console.log('Notifications')}
                />
                <View style={{ marginTop: 130 }}>
                    <VendorDetailsSection
                        photos={[img, img, img, img, img]}
                        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do"
                        onSend={() => console.log('Send button pressed')}
                        reviews={dummyReviews}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
});

