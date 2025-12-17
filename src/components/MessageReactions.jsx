import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const MessageReactions = ({ reactions, onReactionPress, currentUserId, isMe }) => {
    if (!reactions || reactions.length === 0) {
        return null;
    }

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        const emoji = reaction.emoji;
        if (!acc[emoji]) {
            acc[emoji] = {
                emoji: emoji,
                count: 0,
                users: [],
                hasCurrentUser: false,
            };
        }
        acc[emoji].count++;
        acc[emoji].users.push(reaction.user_id);
        if (reaction.user_id === currentUserId) {
            acc[emoji].hasCurrentUser = true;
        }
        return acc;
    }, {});

    const reactionGroups = Object.values(groupedReactions);

    // Sort by count (most popular first)
    reactionGroups.sort((a, b) => b.count - a.count);

    return (
        <View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft]}>
            {reactionGroups.map((group, index) => (
                <TouchableOpacity
                    key={`${group.emoji}-${index}`}
                    style={[
                        styles.reactionBubble,
                        group.hasCurrentUser && styles.reactionBubbleActive,
                    ]}
                    onPress={() => onReactionPress(group.emoji)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.emoji}>{group.emoji}</Text>
                    {group.count > 1 && (
                        <Text
                            style={[
                                styles.count,
                                group.hasCurrentUser && styles.countActive,
                            ]}
                        >
                            {group.count}
                        </Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        marginHorizontal: 5,
        gap: 4,
    },
    containerLeft: {
        alignSelf: 'flex-start',
    },
    containerRight: {
        alignSelf: 'flex-end',
    },
    reactionBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'transparent',
        minWidth: 36,
        justifyContent: 'center',
    },
    reactionBubbleActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    emoji: {
        fontSize: 14,
        marginRight: 2,
    },
    count: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        marginLeft: 2,
    },
    countActive: {
        color: '#2196F3',
    },
});

export default MessageReactions;
