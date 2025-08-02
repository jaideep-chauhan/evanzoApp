import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicon from 'react-native-vector-icons/Ionicons';
import Vendor from '../screens/vendors';
import Events from '../screens/events';
import Profile from '../screens/profile/index';
import { useTheme } from '../ThemeContext';
import icon1 from '../assets/icons/tabNav1.png';
import icon2 from '../assets/icons/tabNav2.png';
import icon3 from '../assets/icons/tabNav3.png';



const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
    const theme = useTheme();
    return (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', pointerEvents: 'box-none' }}>
            <View style={styles.blurContainer} />
            <View style={styles.tabBarContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;


                    let iconName;
                    const isFocused = state.index === index;
                    switch (route.name) {
                        case 'Vendors':
                            iconName = icon1;
                            break;
                        case 'Profile':
                            iconName = icon3;
                            break;
                        case 'Events':
                            iconName = icon2;
                            break;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={[styles.tabItem, isFocused ? styles.tabItemFocused : null]}
                            activeOpacity={0.85}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    isFocused ? styles.iconWrapperFocused : null,
                                ]}
                            >
                                <Image
                                    source={iconName}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        resizeMode: 'contain',
                                        tintColor: isFocused ? '#fff' : theme.colors.primary,
                                    }}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: isFocused ? '#fff' : theme.colors.primary },
                                    isFocused ? styles.tabLabelFocused : null,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    blurContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120, // Adjust to match or slightly exceed tabBarContainer height
        borderRadius: 40,
        marginHorizontal: 0,
        marginBottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: 'rgba(248, 248, 248, 0.3)',
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#F4F4F4',
        borderRadius: 40,
        marginHorizontal: 30,
        marginBottom: 20,
        position: 'relative',
        elevation: 5,
        shadowColor: '#ffffffff',
        shadowOpacity: 0.9,
        shadowOffset: { width: 0, height: -1 },
        shadowRadius: 5,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        borderRadius: 40,
        paddingVertical: 8,
        paddingHorizontal: 2,
        backgroundColor: '#F4F4F4',
        transition: 'background-color 0.2s',
    },
    tabItemFocused: {
        backgroundColor: '#2C3D5B',
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 6,
    },
    iconWrapper: {
        width: 26,
        height: 26,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginVertical: 6,
    },
    iconWrapperFocused: {
        backgroundColor: '#2C3D5B',
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 0,
        marginBottom: 6, // Adjusted for better spacing
        textAlign: 'center',
    },
    tabLabelFocused: {
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

const TabNavigator = () => {
    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                tabBar={props => <CustomTabBar {...props} />}
                screenOptions={{ headerShown: false }}
            >
                <Tab.Screen name="Vendors" component={Vendor} />
                <Tab.Screen name="Events" component={Events} />
                <Tab.Screen name="Profile" component={Profile} />

            </Tab.Navigator>
        </View>
    );
};

export default TabNavigator;
