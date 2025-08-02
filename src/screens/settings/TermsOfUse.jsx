import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsOfUse() {
    const navigation = useNavigation();

    const termsContent = `Welcome to Evanzo, an event planning and vendor marketplace platform. By using our app, you agree to the following terms and conditions:

1. ACCEPTANCE OF TERMS
By accessing and using Evanzo, you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE
Permission is granted to temporarily download one copy of Evanzo per device for personal, non-commercial transitory viewing only.

3. DISCLAIMER
The materials on Evanzo are provided on an 'as is' basis. Evanzo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. LIMITATIONS
In no event shall Evanzo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Evanzo, even if Evanzo or an authorized representative has been notified orally or in writing of the possibility of such damage.

5. ACCURACY OF MATERIALS
The materials appearing on Evanzo could include technical, typographical, or photographic errors. Evanzo does not warrant that any of the materials on its platform are accurate, complete, or current.

6. LINKS
Evanzo has not reviewed all of the sites linked to our platform and is not responsible for the contents of any such linked site.

7. MODIFICATIONS
Evanzo may revise these terms of service at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.

8. GOVERNING LAW
These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.

Last updated: January 2025`;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Use</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>{termsContent}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#41547A',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(65,84,122,0.7)',
        marginRight: 12,
    },
    backIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
    },
    content: {
        fontSize: 15,
        color: '#B0B8C1',
        lineHeight: 24,
        paddingBottom: 20,
    },
});
