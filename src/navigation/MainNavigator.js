import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Image, AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { navigationRef, setAuthLogout } from '../services/navigationService';
// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import OTPVerify from '../screens/auth/OTPVerify';
import ForgotPassword from '../screens/auth/ForgotPassword';
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

// Event Detail Screen
import EventDetailView from '../screens/events/EventDetailView';
import AllReviewsScreen from '../screens/vendors/vendorViewDetails';
import Review from '../screens/vendors/Review';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const { isLoading: authLoading, isAuthenticated, logout } = useAuth();
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
                    require('../assets/images/fb.png'),
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
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator 
                screenOptions={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 300
                }}
                initialRouteName={isAuthenticated ? "Main" : "Login"}
            >
                {!isAuthenticated ? (
                    // Auth Stack - Only shown when not authenticated
                    <>
                        <Stack.Screen 
                            name="Login" 
                            component={LoginScreen}
                            options={{
                                animation: 'fade',
                                animationDuration: 500
                            }}
                        />
                        <Stack.Screen name="Register" component={Register} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                        <Stack.Screen name="OTPVerify" component={OTPVerify} />
                    </>
                ) : (
                    // Protected Stack - Only shown when authenticated
                    <>
                        {/* Main App Screens */}
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="TaskDetail" component={TaskDetail} />

                        {/* Chat Screens */}
                        <Stack.Screen name="Chat" component={VendorChat} />
                        <Stack.Screen name="ChatList" component={ChatList} />
                        <Stack.Screen name="ChatScreen" component={ChatScreen} />


                        {/* Vendor View Details */}
                        <Stack.Screen name="AllReviews" component={AllReviewsScreen} />
                        <Stack.Screen name="Review" component={Review} />

                        {/* Vendor Add Detail Screen */}
                        <Stack.Screen name="VendorAddDetail" component={VendorChat} />
                        <Stack.Screen name="VendorChat" component={VendorChat} />
                        
                        {/* Profile Screens */}
                        <Stack.Screen name="SavedVendors" component={SavedVendors} />

                        {/* Settings Screens */}
                        <Stack.Screen name="Settings" component={Settings} />
                        <Stack.Screen name="Security" component={Security} />
                        <Stack.Screen name="Notifications" component={Notifications} />
                        <Stack.Screen name="Privacy" component={Privacy} />
                        <Stack.Screen name="HelpSupport" component={HelpSupport} />
                        <Stack.Screen name="TermsPolicies" component={TermsPolicies} />
                        <Stack.Screen name="ReportProblem" component={ReportProblem} />
                        <Stack.Screen name="ChangePassword" component={ChangePassword} />
                        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />

                        {/* Event Detail Screen */}
                        <Stack.Screen name="EventDetailView" component={EventDetailView} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default MainNavigator;
