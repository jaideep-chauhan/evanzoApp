import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../ThemeContext';

export default function Tabs({ tabs = [], onTabPress, defaultActive }) {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(
        typeof defaultActive === 'number' && defaultActive >= 0 && defaultActive < tabs.length ? defaultActive : null
    );

    useEffect(() => {
        if (typeof defaultActive === 'number' && defaultActive >= 0 && defaultActive < tabs.length) {
            setActiveIndex(defaultActive);
        }
    }, [defaultActive, tabs.length]);

    const handlePress = (index) => {
        setActiveIndex(index);
        onTabPress && onTabPress(tabs[index], index);
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => {
                const isActive = index === activeIndex;
                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.tab,
                            { backgroundColor: isActive ? theme.colors.primary : theme.colors.tabBackground }
                        ]}
                        onPress={() => handlePress(index)}
                    >
                        <Text style={isActive ? styles.activeText : styles.inactiveText}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 10,
        gap: 8,
        paddingHorizontal: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 13,
    },
    inactiveText: {
        color: '#2A2A3C',
        fontWeight: '500',
        fontSize: 13,
    },
});
