import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Image, AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { navigationRef, setAuthLogout } from '../services/navigationService';
import { linking } from '../services/deepLinkService';
// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import OTPVerify from '../screens/auth/OTPVerify';
import ForgotPassword from '../screens/auth/ForgotPassword';
import ResetPassword from '../screens/auth/ResetPassword';
import TabNavigator from './TabNavigator';
import TaskDetail from '../screens/tasks/TaskDetail';
import VendorChat from '../screens/vendors/vendorAddDetails';
import { ChatList, ChatScreen } from '../screens/chat';
import SavedVendors from '../screens/profile/SavedVendors';
import theme from '../theme';

// Settings Screens
import Settings from '../screens/settings/Settings';
import Security from '../screens/settings/Security';
import Notifications from '../screens/settings/Notifications';
import Privacy from '../screens/settings/Privacy';
import HelpSupport from '../screens/settings/HelpSupport';
import TermsPolicies from '../screens/settings/TermsPolicies';
import ReportProblem from '../screens/settings/ReportProblem';
import ChangePassword from '../screens/settings/ChangePassword';
import TermsOfUse from '../screens/settings/TermsOfUse';
import PrivacyPolicy from '../screens/settings/PrivacyPolicy';
// Moderation screens (block/report flow, login history)
import BlockedUsers from '../screens/settings/BlockedUsers';
import Safety from '../screens/settings/Safety';
import LoginHistory from '../screens/settings/LoginHistory';
// Extended chat screens (chat info sidebar + media & links tab)
import ChatInfoScreen from '../screens/chat/ChatInfoScreen';
import MediaLinksScreen from '../screens/chat/MediaLinksScreen';

// Event Detail Screen
import EventDetailViewEnhanced from '../screens/events/EventDetailViewEnhanced';
import AllReviewsScreen from '../screens/vendors/vendorViewDetails';
import Review from '../screens/vendors/Review';

// Search overlay (opened from the Vendors/Events search input)
import SearchScreen from '../screens/search';

// Notification inbox (the received-notifications timeline — distinct from
// the Notifications settings screen, which is just preference toggles).
import NotificationInbox from '../screens/notifications/NotificationInbox';

// User Profile Screen
import UserProfile from '../screens/profile/UserProfile';

import { withProtectedScreen } from '../components/ProtectedScreen';

// Guest gating for every screen that legitimately requires a signed-in
// user. Chat / settings / saved / notifications / moderation / write-review.
// Public-content routes (Main, VendorAddDetail, EventDetailView, AllReviews,
// Search, info pages) are deliberately NOT wrapped — those are guest-safe.
const ChatGuarded            = withProtectedScreen(ChatScreen,        'Sign in to chat with vendors');
const ChatListGuarded        = withProtectedScreen(ChatList,          'Sign in to view your messages');
const ReviewGuarded          = withProtectedScreen(Review,            'Sign in to leave a review');
const SavedVendorsGuarded    = withProtectedScreen(SavedVendors,      'Sign in to view your saved vendors');
const SettingsGuarded        = withProtectedScreen(Settings,          'Sign in to access settings');
const SecurityGuarded        = withProtectedScreen(Security,          'Sign in to manage security settings');
const NotificationsGuarded   = withProtectedScreen(Notifications,     'Sign in to manage notification preferences');
const PrivacyGuarded         = withProtectedScreen(Privacy,           'Sign in to manage privacy settings');
const ChangePasswordGuarded  = withProtectedScreen(ChangePassword,    'Sign in to change your password');
const BlockedUsersGuarded    = withProtectedScreen(BlockedUsers,      'Sign in to manage blocked users');
const SafetyGuarded          = withProtectedScreen(Safety,            'Sign in to access safety controls');
const LoginHistoryGuarded    = withProtectedScreen(LoginHistory,      'Sign in to view your login history');
const ChatInfoGuarded        = withProtectedScreen(ChatInfoScreen,    'Sign in to view chat details');
const MediaLinksGuarded      = withProtectedScreen(MediaLinksScreen,  'Sign in to view shared media');
const NotificationInboxGuarded = withProtectedScreen(NotificationInbox, 'Sign in to view your notifications');
const UserProfileGuarded     = withProtectedScreen(UserProfile,       'Sign in to view profile');

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const { isLoading: authLoading, logout } = useAuth();
    const [isReady, setIsReady] = useState(false);
    const [splashTimerDone, setSplashTimerDone] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);

    // Set the logout function for navigation service
    useEffect(() => {
        setAuthLogout(logout);
    }, [logout]);


    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
            subscription.remove();
        };
    }, [appState]);

    useEffect(() => {
        let isMounted = true;
        let splashTimer;
        let maxLoadTimer;
        
        // Preload images while splash screen is showing
        const preloadImages = async () => {
            try {
                // Load all critical images
                const images = [
                    theme.images.background,
                    require('../assets/images/apple.png'),
                    require('../assets/images/google.png'),
                    require('../assets/images/evanzoLogo.png')
                ];
                
                // Use Image.prefetch for all images
                const imagePromises = images.map(image => {
                    const uri = Image.resolveAssetSource(image).uri;
                    return Image.prefetch(uri);
                });
                
                await Promise.all(imagePromises);
                
                // Add a small delay to ensure images are in memory
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (isMounted) {
                    setIsReady(true);
                }
            } catch (error) {
                // Still set ready after error to avoid infinite loading
                if (isMounted) {
                    setIsReady(true);
                }
            }
        };

        preloadImages();

        // Minimum splash screen display time
        splashTimer = setTimeout(() => {
            if (isMounted) {
                setSplashTimerDone(true);
            }
        }, 2800);

        // Maximum loading time to prevent infinite loading
        maxLoadTimer = setTimeout(() => {
            if (isMounted && (!isReady || !splashTimerDone)) {
                setIsReady(true);
                setSplashTimerDone(true);
            }
        }, 5000); // 5 seconds maximum

        return () => {
            isMounted = false;
            if (splashTimer) {
                clearTimeout(splashTimer);
            }
            if (maxLoadTimer) {
                clearTimeout(maxLoadTimer);
            }
        };
    }, []);

    // Show splash screen until both conditions are met
    if (!isReady || !splashTimerDone || authLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer ref={navigationRef} linking={linking}>
            <Stack.Navigator
                screenOptions={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 300
                }}
                // Guest-mode flow: the app always opens on Main (the tab navigator).
                // Login / Register / forgot-password screens are registered too, so
                // anywhere in the app that needs auth can `navigation.navigate('Login')`
                // and come back when done. Apple Guideline 5.1.1 also requires that
                // guests can browse without being forced to authenticate first.
                initialRouteName="Main"
            >
                    <>
                        {/* Always-accessible Main shell (Vendors / Events / etc.) */}
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="TaskDetail" component={TaskDetail} />

                        {/* Chat Screens — VendorChat is the vendor-detail
                            page (public browsing surface even though the
                            route is named "Chat"), so it stays unguarded.
                            Actual messaging surfaces are guest-gated. */}
                        <Stack.Screen name="Chat" component={VendorChat} />
                        <Stack.Screen name="ChatList" component={ChatListGuarded} />
                        <Stack.Screen name="ChatScreen" component={ChatGuarded} />
                        <Stack.Screen name="ChatInfo" component={ChatInfoGuarded} />
                        <Stack.Screen name="MediaLinks" component={MediaLinksGuarded} />


                        {/* Vendor View Details — AllReviews is public read,
                            Review (write) is guest-gated. */}
                        <Stack.Screen name="AllReviews" component={AllReviewsScreen} />
                        <Stack.Screen name="Review" component={ReviewGuarded} />

                        {/* Vendor Add Detail Screen */}
                        <Stack.Screen name="VendorAddDetail" component={VendorChat} />
                        <Stack.Screen name="VendorChat" component={VendorChat} />

                        {/* Standalone Search overlay */}
                        <Stack.Screen
                            name="Search"
                            component={SearchScreen}
                            options={{ animation: 'fade_from_bottom' }}
                        />

                        {/* Received-notifications inbox (NOT the settings screen
                            registered as "Notifications" below). */}
                        <Stack.Screen name="NotificationInbox" component={NotificationInboxGuarded} />

                        {/* Profile Screens */}
                        <Stack.Screen name="SavedVendors" component={SavedVendorsGuarded} />

                        {/* Settings Screens — HelpSupport / TermsPolicies /
                            TermsOfUse / PrivacyPolicy / ReportProblem are
                            informational and stay guest-readable. */}
                        <Stack.Screen name="Settings" component={SettingsGuarded} />
                        <Stack.Screen name="Security" component={SecurityGuarded} />
                        <Stack.Screen name="Notifications" component={NotificationsGuarded} />
                        <Stack.Screen name="Privacy" component={PrivacyGuarded} />
                        <Stack.Screen name="HelpSupport" component={HelpSupport} />
                        <Stack.Screen name="TermsPolicies" component={TermsPolicies} />
                        <Stack.Screen name="ReportProblem" component={ReportProblem} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordGuarded} />
                        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />

                        {/* Moderation flow — guest-gated */}
                        <Stack.Screen name="BlockedUsers" component={BlockedUsersGuarded} />
                        <Stack.Screen name="Safety" component={SafetyGuarded} />
                        <Stack.Screen name="LoginHistory" component={LoginHistoryGuarded} />

                        {/* Event Detail Screen — public browsing */}
                        <Stack.Screen name="EventDetailView" component={EventDetailViewEnhanced} />

                        {/* User Profile Screen — guest-gated */}
                        <Stack.Screen name="UserProfile" component={UserProfileGuarded} />

                        {/* Auth screens — registered globally so any guest
                            screen can `navigation.navigate('Login')` when a
                            sign-in-required action is tapped. They're pushed
                            modally (no initial-route) instead of replacing
                            the main shell. */}
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ animation: 'fade', animationDuration: 500 }}
                        />
                        <Stack.Screen name="Register" component={Register} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                        <Stack.Screen name="ResetPassword" component={ResetPassword} />
                        <Stack.Screen name="OTPVerify" component={OTPVerify} />
                    </>
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default MainNavigator;
