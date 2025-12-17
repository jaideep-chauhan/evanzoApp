import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

const ReactionPicker = ({ visible, onReactionSelect, onClose, position }) => {
    const [scaleAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    // Popular reactions
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

    const handleReactionPress = (emoji) => {
        console.log('👍 ReactionPicker - Emoji selected:', emoji);
        console.log('👍 ReactionPicker - Calling onReactionSelect');
        onReactionSelect(emoji);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <Animated.View
                    style={[
                        styles.pickerContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            top: position?.y ? position.y - 60 : '50%',
                            left: position?.x ? Math.min(position.x, width - 320) : '10%',
                        },
                    ]}
                >
                    <View style={styles.reactionsRow}>
                        {reactions.map((emoji, index) => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.reactionButton}
                                onPress={() => handleReactionPress(emoji)}
                                activeOpacity={0.7}
                            >
                                <Animated.Text
                                    style={[
                                        styles.emoji,
                                        {
                                            transform: [
                                                {
                                                    scale: scaleAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 1],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    {emoji}
                                </Animated.Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    pickerContainer: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    reactionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reactionButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
    },
    emoji: {
        fontSize: 24,
    },
});

export default ReactionPicker;
