import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';

const dummyTasks = [
    { id: '#T98432', title: 'Gold Pendant – 3 Stones', due: '25 May', date: '06 May,25', status: 'New' },
    { id: '#T98433', title: 'Silver Pendant – 5 Stones', due: '25 May', date: '06 May,25', status: 'In progress' },
    { id: '#T98434', title: 'Platinum Ring – 2 Stones', due: '25 May', date: '06 May,25', status: 'Completed' },
    { id: '#T98435', title: 'Platinum Ring – 4 Stones', due: '25 May', date: '06 May,25', status: 'Completed' },
];

const filterOptions = ['All', 'New', 'In progress', 'Completed'];

const StatusBadge = ({ status }) => {
    const bgColor = {
        New: '#DCD4FF',
        'In progress': '#D0E3FF',
        Completed: '#C5F3DE',
    };

    return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor[status] }]}>
            <Text style={styles.statusText}>{status}</Text>
        </View>
    );
};

const TaskCard = ({ navigation, task }) => (
    <View style={styles.taskCard}>
        <View style={styles.taskTop}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDate}>{task.date}</Text>
        </View>
        <Text style={styles.taskId}>{task.id}</Text>
        <Text style={styles.dueText}>📅 Due: {task.due}</Text>
        <View style={styles.taskBottom}>
            <StatusBadge status={task.status} />
            <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            >
                <Text style={styles.viewText}>View Details</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const TaskList = () => {
    const navigation = useNavigation();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const filteredTasks = dummyTasks.filter(task => {
        const matchFilter = filter === 'All' || task.status === filter;
        const matchSearch =
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.id.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <TopBar title="My Tasks" showBack={true} showNotification={true} />

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* Search Input with Icon */}
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search task name or ID..."
                            style={styles.inputWithIcon}
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>


                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {filterOptions.map(option => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.filterChip,
                                filter === option && styles.filterActive,
                            ]}
                            onPress={() => setFilter(option)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === option && styles.filterTextActive,
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Task List */}
                <View style={styles.listContainer}>
                    {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} navigation={navigation} />
                    ))}
                    {filteredTasks.length === 0 && (
                        <Text style={styles.noTasksText}>No tasks found.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TaskList;

const styles = StyleSheet.create({
    container: {
        paddingBottom: 24,
    },
    searchBar: {
        marginTop: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderColor: '#ddd',
        borderWidth: 1,
        height: 44,
    },

    searchIcon: {
        marginLeft: 10,
        marginRight: 8,
    },
    inputWithIcon: {
        flex: 1,
        fontSize: 14,
        paddingRight: 14,
        color: '#111',
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#F8F8F8',
    },
    filterActive: {
        backgroundColor: '#007BFF',
        borderColor: '#007BFF',
    },
    filterText: {
        fontSize: 13,
        color: '#333',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    taskTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    taskDate: {
        fontSize: 12,
        color: '#999',
    },
    taskId: {
        fontSize: 12,
        color: '#007BFF',
        marginVertical: 4,
    },
    dueText: {
        fontSize: 12,
        color: 'red',
        marginBottom: 10,
    },
    taskBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#111',
    },
    viewBtn: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    noTasksText: {
        textAlign: 'center',
        fontSize: 14,
        marginTop: 20,
        color: '#999',
    },
});
