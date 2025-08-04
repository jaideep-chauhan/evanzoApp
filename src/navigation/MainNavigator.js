import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import OTPVerify from '../screens/auth/OTPVerify';
import TabNavigator from './TabNavigator';
import TaskDetail from '../screens/tasks/TaskDetail';
import VendorChat from '../screens/vendors/vendorAddDetails';
import { ChatList, ChatScreen } from '../screens/chat';

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

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (showSplash) return <SplashScreen />;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* Auth Screens */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="OTPVerify" component={OTPVerify} />

                {/* Main App Screens */}
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="TaskDetail" component={TaskDetail} />

                {/* Chat Screens */}
                <Stack.Screen name="Chat" component={VendorChat} />
                <Stack.Screen name="ChatList" component={ChatList} />
                <Stack.Screen name="ChatScreen" component={ChatScreen} />

                {/* Vendor Add Detail Screen */}
                <Stack.Screen name="VendorAddDetail" component={VendorChat} />

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
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default MainNavigator;
