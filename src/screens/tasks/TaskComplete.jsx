import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import TopBar from '../../components/ui/TopBar';

const TaskComplete = () => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <TopBar title="Gold Pendant - 3 Stones" showBack={true} showNotification={true} />

            <View style={styles.container}>
                {/* Checkmark icon */}
                <View style={styles.iconWrap}>
                    <View style={styles.checkCircle}>
                        <Icon name="check" size={36} color="#fff" />
                    </View>
                </View>

                {/* Success Text */}
                <Text style={styles.successText}>Task Completed Successfully!</Text>
                <Text style={styles.description}>Great job! You can view your completed tasks or return to the task list.</Text>

                {/* Task Details */}
                <View style={styles.detailCard}>
                    <Text style={styles.detailTitle}>Task Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Task Name:</Text>
                        <Text style={styles.value}>Gold Pendant - 3 Stones</Text>
                        <Text style={styles.link}>#T98432</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Assigned:</Text>
                        <Text style={styles.value}>21 May, 25</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Due Date:</Text>
                        <Text style={styles.value}>25 May, 25</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.primaryBtn}>
                        <Text style={styles.primaryText}>View Completed Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineBtn}>
                        <Text style={styles.outlineText}>Return To Task List</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default TaskComplete;

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    iconWrap: {
        marginVertical: 20,
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2E7D32',
        marginTop: 10,
    },
    description: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    detailTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
        color: '#111',
    },
    detailRow: {
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        color: '#888',
    },
    value: {
        fontSize: 14,
        color: '#111',
        fontWeight: '500',
    },
    link: {
        fontSize: 13,
        color: '#007BFF',
        textAlign: 'right',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryText: {
        color: '#fff',
        fontWeight: '600',
    },
    outlineBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    outlineText: {
        color: '#007BFF',
        fontWeight: '600',
    },
});
