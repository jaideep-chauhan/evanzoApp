import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import {
    UserGroupIcon,
    CalendarDaysIcon,
    UserIcon,
    ChatBubbleLeftRightIcon
} from 'react-native-heroicons/outline';
import {
    UserGroupIcon as UserGroupIconSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    UserIcon as UserIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid
} from 'react-native-heroicons/solid';
import Vendor from '../screens/vendors';
import Events from '../screens/events';
import Profile from '../screens/profile/index';
import ChatList from '../screens/chat/ChatList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { withProtectedScreen } from '../components/ProtectedScreen';

// Tabs that need a signed-in user. Guests get the LoginPrompt component
// instead of the actual screen content. Vendors / Events stay public.
const ProtectedChatList = withProtectedScreen(ChatList, 'Sign in to view your messages');
const ProtectedProfile  = withProtectedScreen(Profile,  'Sign in to access your profile');



const Tab = createBottomTabNavigator();

// Detail / full-screen routes nested inside a tab's stack where the tab bar
// would overlap the screen's own bottom UI (e.g. the sticky chat-input on
// VendorAddDetail). Render nothing for the bar when one of these is focused.
const HIDE_TAB_BAR_ON_SCREENS = new Set([
    'VendorAddDetail',
    'VendorChat',
    'AllReviews',
    'EventDetailView',
]);

const getFocusedDeepRouteName = (route) => {
    const nested = route?.state;
    if (!nested?.routes?.length) return route?.name;
    const child = nested.routes[nested.index ?? 0];
    return getFocusedDeepRouteName(child);
};

function CustomTabBar({ state, descriptors, navigation }) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    // Android only: sit the floating pill just above the device's bottom inset
    // (gesture bar / nav bar) instead of a fixed 20px, which on phones with a
    // tall inset made the bar take up too much height. Clamp to a small range so
    // it stays tight on gesture phones and still clears 3-button nav bars.
    // iOS keeps the original fixed 20px spacing.
    const bottomGap = Platform.OS === 'android'
        ? Math.max(Math.min(insets.bottom, 16), 8)
        : 20;

    // Walk into the focused tab's nested stack and bail out if the visible
    // screen is a detail page.
    const focusedRoute = state.routes[state.index];
    const deepName = getFocusedDeepRouteName(focusedRoute);
    if (deepName && HIDE_TAB_BAR_ON_SCREENS.has(deepName)) {
        return null;
    }

    return (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', pointerEvents: 'box-none' }}>
            <LinearGradient
                colors={[
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(255, 255, 255, 0.6)',
                    'rgba(255, 255, 255, 0.85)'
                ]}
                locations={[0, 0.4, 0.7, 1]}
                style={styles.gradientOverlay}
                pointerEvents="none"
            />
            <View style={[styles.tabBarContainer, { marginBottom: bottomGap }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;


                    const isFocused = state.index === index;

                    const getIcon = () => {
                        const iconProps = {
                            size: 24,
                            color: isFocused ? '#fff' : theme.colors.primary,
                            strokeWidth: 2
                        };

                        switch (route.name) {
                            case 'Vendors':
                                return isFocused ?
                                    <UserGroupIconSolid {...iconProps} /> :
                                    <UserGroupIcon {...iconProps} />;
                            case 'Events':
                                return isFocused ?
                                    <CalendarDaysIconSolid {...iconProps} /> :
                                    <CalendarDaysIcon {...iconProps} />;
                            case 'Messages':
                                return isFocused ?
                                    <ChatBubbleLeftRightIconSolid {...iconProps} /> :
                                    <ChatBubbleLeftRightIcon {...iconProps} />;
                            case 'Profile':
                                return isFocused ?
                                    <UserIconSolid {...iconProps} /> :
                                    <UserIcon {...iconProps} />;
                            default:
                                return null;
                        }
                    };

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
                                {getIcon()}
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
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120,
        width: '100%',
        zIndex: 0,
        ...Platform.select({
            ios: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            },
        }),
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#F4F4F4',
        borderRadius: 40,
        marginHorizontal: 20,
        // marginBottom is applied dynamically from the safe-area inset in
        // CustomTabBar so the bar height adapts to each phone.
        position: 'relative',
        elevation: 0,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        borderRadius: 40,
        // Android-only tighter padding; iOS keeps original 8.
        paddingVertical: Platform.select({ android: 6, ios: 8 }),
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
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        // Android-only tighter spacing; iOS keeps original 4.
        marginVertical: Platform.select({ android: 2, ios: 4 }),
    },
    iconWrapperFocused: {
        backgroundColor: 'transparent',
    },
    tabLabel: {
        // Android-only tighter label sizing/spacing; iOS keeps original 14 / 6.
        fontSize: Platform.select({ android: 13, ios: 14 }),
        fontWeight: '600',
        marginTop: 0,
        marginBottom: Platform.select({ android: 3, ios: 6 }),
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
                <Tab.Screen name="Messages" component={ProtectedChatList} />
                <Tab.Screen name="Profile" component={ProtectedProfile} />
            </Tab.Navigator>
        </View>
    );
};

export default TabNavigator;
