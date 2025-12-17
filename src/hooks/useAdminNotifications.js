import { useEffect } from 'react';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';
import Toast from 'react-native-toast-message';
import { AppState } from 'react-native';

// Hook to handle admin notifications for ad approvals/rejections
const useAdminNotifications = () => {
    useEffect(() => {
        // Listen for ad approval notifications
        const handleAdApproval = async (data) => {
            console.log('📢 Ad approved notification:', data);
            
            const { ad_type, ad_id, ad_title, message } = data;
            
            // Show local notification
            await notificationService.displayNotification({
                data: {
                    type: 'admin_notification',
                    action: 'ad_approved',
                    ad_type: ad_type,
                    ad_id: ad_id,
                },
                notification: {
                    title: '✅ Ad Approved!',
                    body: message || `Your ${ad_type} ad "${ad_title}" has been approved and is now live.`,
                }
            });
            
            // Show in-app toast if app is active
            if (AppState.currentState === 'active') {
                Toast.show({
                    type: 'success',
                    text1: '✅ Ad Approved!',
                    text2: message || `Your ${ad_type} ad has been approved.`,
                    position: 'top',
                    visibilityTime: 4000,
                });
            }
        };

        // Listen for ad rejection notifications
        const handleAdRejection = async (data) => {
            console.log('📢 Ad rejected notification:', data);
            
            const { ad_type, ad_id, ad_title, message, rejection_reason } = data;
            
            // Show local notification
            await notificationService.displayNotification({
                data: {
                    type: 'admin_notification',
                    action: 'ad_rejected',
                    ad_type: ad_type,
                    ad_id: ad_id,
                    rejection_reason: rejection_reason,
                },
                notification: {
                    title: '❌ Ad Rejected',
                    body: message || `Your ${ad_type} ad "${ad_title}" has been rejected. ${rejection_reason ? `Reason: ${rejection_reason}` : 'Please review and resubmit.'}`,
                }
            });
            
            // Show in-app toast if app is active
            if (AppState.currentState === 'active') {
                Toast.show({
                    type: 'error',
                    text1: '❌ Ad Rejected',
                    text2: message || `Your ${ad_type} ad has been rejected. Please review and resubmit.`,
                    position: 'top',
                    visibilityTime: 5000,
                });
            }
        };

        // Listen for ad status update notifications
        const handleAdStatusUpdate = async (data) => {
            console.log('📢 Ad status update notification:', data);
            
            const { ad_type, ad_id, ad_title, status, message } = data;
            
            // Show local notification
            await notificationService.displayNotification({
                data: {
                    type: 'admin_notification',
                    action: 'ad_status_update',
                    ad_type: ad_type,
                    ad_id: ad_id,
                    status: status,
                },
                notification: {
                    title: '📋 Ad Status Update',
                    body: message || `Your ${ad_type} ad "${ad_title}" status has been updated to ${status}.`,
                }
            });
            
            // Show in-app toast if app is active
            if (AppState.currentState === 'active') {
                Toast.show({
                    type: 'info',
                    text1: '📋 Ad Status Update',
                    text2: message || `Your ${ad_type} ad status has been updated.`,
                    position: 'top',
                    visibilityTime: 3000,
                });
            }
        };

        // Subscribe to socket events
        socketService.on('ad-approved', handleAdApproval);
        socketService.on('ad-rejected', handleAdRejection);
        socketService.on('ad-status-update', handleAdStatusUpdate);

        // Cleanup subscriptions
        return () => {
            socketService.off('ad-approved', handleAdApproval);
            socketService.off('ad-rejected', handleAdRejection);
            socketService.off('ad-status-update', handleAdStatusUpdate);
        };
    }, []);
};

export default useAdminNotifications;