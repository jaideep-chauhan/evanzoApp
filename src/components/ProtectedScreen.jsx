import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoginPrompt from './LoginPrompt';

/**
 * Higher-order component that protects screens requiring authentication
 * Shows LoginPrompt if user is not authenticated
 */
const withProtectedScreen = (WrappedComponent, customMessage) => {
    return (props) => {
        const { isAuthenticated } = useAuth();
        const navigation = useNavigation();

        if (!isAuthenticated) {
            return (
                <LoginPrompt
                    message={customMessage || "Sign in to access this feature"}
                />
            );
        }

        return <WrappedComponent {...props} />;
    };
};

/**
 * Component version for inline use
 */
const ProtectedScreen = ({ children, message, fallback }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        if (fallback) {
            return fallback;
        }
        return <LoginPrompt message={message || "Sign in to access this feature"} />;
    }

    return children;
};

export { withProtectedScreen, ProtectedScreen };
export default ProtectedScreen;
