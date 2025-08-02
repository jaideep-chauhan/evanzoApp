import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import TopBar from '../../components/ui/TopBar';
import EditTask from './EditTask';
import TaskComplete from './TaskComplete';

const TaskDetail = () => {
    const donePercent = 30;
    const [editVisible, setEditVisible] = useState(false);
    const [completeVisible, setCompleteVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(600));

    const openEditPopup = () => {
        setEditVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

    const closeEditPopup = () => {
        Animated.timing(slideAnim, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
        }).start(() => setEditVisible(false));
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <TopBar title="Task Information" showBack={true} showNotification={true} />

            <ScrollView contentContainerStyle={styles.container}>

                {/* Product Info */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Product Name:</Text>
                        <Text style={styles.link}>#R02349</Text>
                    </View>
                    <Text style={styles.title}>Gold Pendant – 3 Stones</Text>

                    <Text style={styles.label}>Description:</Text>
                    <View style={styles.textbox}>
                        <Text style={styles.text}>Resize this gold pendant.{"\n"}Add 3 stones on the top of the ring.</Text>
                    </View>

                    <View style={[styles.rowBetween, { marginTop: 16 }]}>
                        <View style={[styles.dateBadge, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={styles.dateText}>Assigned: 21 May, 25</Text>
                        </View>
                        <View style={[styles.dateBadge, { backgroundColor: '#FFEBEE' }]}>
                            <Text style={[styles.dateText, { color: '#C62828' }]}>Due: 25 May,25</Text>
                        </View>
                    </View>
                </View>

                {/* Task Progress */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Task Progress</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressDoneBar, { width: `${donePercent}%` }]} />
                        <View style={styles.progressLabelWrap}>
                            <Text style={styles.progressLabel}>{donePercent}% Completed</Text>
                        </View>
                    </View>
                    <View style={styles.rowBetween}>
                        <Text style={styles.smallText}>Progressing through steps</Text>
                        <Text style={styles.smallText}>Duration: 00:00:00</Text>
                    </View>
                </View>

                {/* Task Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Task Details</Text>

                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Materials Allotted</Text>
                        <Text style={styles.label}>Total: 10.0g</Text>
                    </View>
                    <View style={styles.rowWrap}>
                        <Text style={styles.goldTag}>💰 Gold 18K – 4g</Text>
                        <Text style={styles.redTag}>💎 Ruby – 3 pcs</Text>
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Process Flow</Text>
                    <View style={styles.flow}>
                        <Text style={styles.flowInactive}>Casting</Text>
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.flowActive}>Filing</Text>
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.flowInactive}>Polishing</Text>
                    </View>

                    <View style={[styles.sliderBar, { marginBottom: 20 }]}>
                        <View style={[styles.sliderFill, { width: '33%' }]}>
                            <View style={styles.sliderHandle} />
                        </View>
                    </View>

                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Material Used</Text>
                        <Text style={styles.label}>Total: 8.0g</Text>
                    </View>
                    <View style={styles.rowWrap}>
                        <Text style={styles.goldTag}>💰 Gold 18K – 2g</Text>
                        <Text style={styles.redTag}>💎 Ruby – 3 pcs</Text>
                    </View>
                </View>

                {/* Comments */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Comments & Updates</Text>

                    <View style={styles.commentBox}>
                        <Text style={styles.commentText}>Let me know the progress.....</Text>
                        <Text style={styles.meta}>John · 09:15 AM</Text>
                    </View>

                    <View style={[styles.commentBox, styles.reply]}>
                        <Text style={styles.replyText}>The Filing process has started.</Text>
                        <Text style={styles.meta}>Miley · 09:20 AM</Text>
                    </View>

                    <View style={styles.inputRow}>
                        <TextInput placeholder="Add a Comment" placeholderTextColor="#888" style={styles.input} />
                        <TouchableOpacity><Icon name="camera" size={18} color="#555" /></TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 10 }}><Icon name="send" size={18} color="#007BFF" /></TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnPrimary} onPress={openEditPopup}>
                    <Text style={styles.btnPrimaryText}>Edit Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setCompleteVisible(true)}>
                    <Text style={styles.btnSecondaryText}>Mark as Completed</Text>
                </TouchableOpacity>
            </View>

            {/* Edit Popup Modal */}
            <Modal visible={editVisible} transparent animationType="none">
                <View style={styles.modalBackdrop}>
                    <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Task</Text>
                            <TouchableOpacity onPress={closeEditPopup}>
                                <Icon name="x" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <EditTask />
                    </Animated.View>
                </View>
            </Modal>
            <Modal visible={completeVisible} animationType="slide">
                <TaskComplete />
            </Modal>
        </SafeAreaView>
    );
};

export default TaskDetail;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    rowWrap: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#333',
    },
    textbox: {
        backgroundColor: '#F1F1F1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    text: {
        fontSize: 13,
        color: '#444',
    },
    link: {
        color: '#007BFF',
        fontSize: 13,
        fontWeight: '500',
    },
    dateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#333',
    },
    progressBarContainer: {
        height: 12,
        width: '100%',
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
    },
    progressDoneBar: {
        backgroundColor: '#4CAF50',
        height: '100%',
    },
    progressLabelWrap: {
        position: 'absolute',
        top: 2,
        left: 10,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    smallText: {
        fontSize: 13,
        color: '#555',
    },
    goldTag: {
        backgroundColor: '#FFF8E1',
        color: '#E65100',
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    redTag: {
        backgroundColor: '#FCE4EC',
        color: '#C2185B',
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    flow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    arrow: {
        fontSize: 16,
        color: '#999',
        marginHorizontal: 6,
    },
    flowInactive: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#F0F0F0',
        fontSize: 13,
        color: '#999',
    },
    flowActive: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderColor: '#000',
        borderWidth: 1,
        fontSize: 13,
        color: '#000',
    },
    sliderBar: {
        backgroundColor: '#F4F4F4',
        height: 6,
        borderRadius: 6,
        overflow: 'hidden',
        marginTop: 6,
    },
    sliderFill: {
        height: 6,
        backgroundColor: '#FFD600',
        borderRadius: 6,
        position: 'relative',
    },
    sliderHandle: {
        width: 16,
        height: 16,
        backgroundColor: '#FFD600',
        borderRadius: 8,
        position: 'absolute',
        top: -5,
        right: 0,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 14,
        color: '#111',
    },
    commentBox: {
        backgroundColor: '#F5F5F5',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    reply: {
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-end',
    },
    commentText: {
        fontSize: 13,
        color: '#333',
    },
    replyText: {
        fontSize: 13,
        color: '#0D47A1',
    },
    meta: {
        fontSize: 11,
        color: '#777',
        marginTop: 4,
    },
    inputRow: {
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 13,
        marginRight: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    btnPrimary: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    btnSecondary: {
        borderWidth: 1,
        borderColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    btnSecondaryText: {
        color: '#007BFF',
        fontWeight: '600',
        fontSize: 14,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
});
