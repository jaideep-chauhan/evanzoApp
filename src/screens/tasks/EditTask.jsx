import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const EditTask = () => {
    const [materialUsed, setMaterialUsed] = useState({
        gold: '2g',
        ruby: '3pcs',
    });

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={styles.sectionHeading}>Edit Task Details</Text>

                {/* Header Section */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Gold Pendant – 3 Stones</Text>
                        <Text style={styles.description}>
                            Task Description: Resize this gold pendant.{"\n"}Add 3 stones on the top of the ring.
                        </Text>
                    </View>
                    <Text style={styles.taskId}>#T98432</Text>
                </View>

                {/* Progress Section */}
                <View style={styles.progressRow}>
                    <View style={styles.progressDot}>
                        <Text style={styles.progressNumber}>10</Text>
                    </View>
                    <View style={styles.progressLine} />
                </View>
                <View style={styles.progressMetaRow}>
                    <Text style={styles.metaText}>Task Progress</Text>
                    <Text style={styles.metaText}>Assigned: 21 May,25</Text>
                    <Text style={[styles.metaText, { color: '#D32F2F' }]}>Due: 25 May,25</Text>
                </View>

                {/* Materials Allotted */}
                <Text style={styles.subHeading}>Materials Allotted</Text>
                <View style={styles.materialRow}>
                    <TextInput style={styles.disabledInput} value="Gold 18K" editable={false} />
                    <TextInput style={styles.disabledInput} value="4g" editable={false} />
                </View>
                <View style={styles.materialRow}>
                    <TextInput style={styles.disabledInput} value="Ruby" editable={false} />
                    <TextInput style={styles.disabledInput} value="3pcs" editable={false} />
                </View>

                {/* Process Flow */}
                <Text style={styles.subHeading}>Process Flow</Text>
                <View style={styles.processRow}>
                    <TextInput style={styles.processInput} placeholder="Step 1" value="Filing" editable={false} />
                    <TouchableOpacity style={styles.addBtn}>
                        <Icon name="plus" size={18} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Material Used */}
                <Text style={styles.subHeading}>Material Used</Text>
                <Text style={styles.totalLabel}>Total</Text>
                <View style={styles.materialRow}>
                    <TextInput style={styles.input} value="Gold 18K" editable={false} />
                    <TextInput
                        style={styles.input}
                        value={materialUsed.gold}
                        onChangeText={(text) => setMaterialUsed({ ...materialUsed, gold: text })}
                    />
                </View>
                <View style={styles.materialRow}>
                    <TextInput style={styles.input} value="Ruby" editable={false} />
                    <TextInput
                        style={styles.input}
                        value={materialUsed.ruby}
                        onChangeText={(text) => setMaterialUsed({ ...materialUsed, ruby: text })}
                    />
                </View>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn}>
                        <Text style={styles.saveText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default EditTask;


const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 60,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    headerRow: {
        marginBottom: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#444',
    },
    taskId: {
        fontSize: 13,
        color: '#007BFF',
        textAlign: 'right',
        marginTop: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    progressDot: {
        width: 24,
        height: 24,
        backgroundColor: '#2196F3',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressNumber: {
        color: '#fff',
        fontWeight: '600',
    },
    progressLine: {
        height: 2,
        flex: 1,
        backgroundColor: '#ccc',
        marginLeft: 4,
    },
    progressMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    subHeading: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    materialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 10,
    },
    disabledInput: {
        flex: 1,
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#999',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#333',
    },
    processRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    processInput: {
        flex: 1,
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#666',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: {
        color: '#333',
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
});

