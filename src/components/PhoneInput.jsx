import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import PhoneNumberInput from 'react-native-phone-number-input';
import { useTheme } from '../ThemeContext';

const CustomPhoneInput = ({
    value = '',
    onChangeText,
    onChangeFormattedText,
    onChangeCountry,
    placeholder = 'Enter phone number',
    editable = true,
    error = false,
    defaultCountry = 'US',
    style,
    containerStyle,
    textContainerStyle,
    textInputStyle,
    codeTextStyle,
    flagButtonStyle,
    ...props
}) => {
    const phoneInput = useRef(null);
    const theme = useTheme();
    const [phoneNumber, setPhoneNumber] = useState(value);
    const [formattedValue, setFormattedValue] = useState('');
    const [countryCode, setCountryCode] = useState(defaultCountry);
    const [callingCode, setCallingCode] = useState('+1');

    useEffect(() => {
        if (value !== phoneNumber) {
            setPhoneNumber(value);
        }
    }, [value]);

    const handleChangeText = (text) => {
        setPhoneNumber(text);
        if (onChangeText) {
            onChangeText(text);
        }
    };

    const handleChangeFormattedText = (text) => {
        setFormattedValue(text);
        if (onChangeFormattedText) {
            onChangeFormattedText(text);
        }
    };

    const handleSelectCountry = (country) => {
        setCountryCode(country.cca2);
        setCallingCode(`+${country.callingCode[0]}`);
        if (onChangeCountry) {
            onChangeCountry({
                countryCode: country.cca2,
                callingCode: `+${country.callingCode[0]}`,
                country: country
            });
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <PhoneNumberInput
                ref={phoneInput}
                defaultValue={phoneNumber}
                defaultCode={countryCode}
                layout="first"
                onChangeText={handleChangeText}
                onChangeFormattedText={handleChangeFormattedText}
                onChangeCountry={handleSelectCountry}
                placeholder={placeholder}
                disabled={!editable}
                containerStyle={[
                    styles.phoneContainer,
                    {
                        backgroundColor: '#F4F6FA',
                        borderColor: error ? '#ff6b6b' : '#E5EAF2',
                    },
                    style
                ]}
                textContainerStyle={[
                    styles.textContainer,
                    {
                        backgroundColor: '#F4F6FA',
                    },
                    textContainerStyle
                ]}
                textInputStyle={[
                    styles.textInput,
                    {
                        color: theme.colors.primary,
                    },
                    textInputStyle
                ]}
                codeTextStyle={[
                    styles.codeText,
                    {
                        color: theme.colors.primary,
                    },
                    codeTextStyle
                ]}
                flagButtonStyle={[
                    styles.flagButton,
                    flagButtonStyle
                ]}
                countryPickerButtonStyle={[
                    styles.countryButton
                ]}
                countryPickerProps={{
                    withFlag: true,
                    withFilter: true,
                    withCallingCode: true,
                    withEmoji: false,
                    withAlphaFilter: true,
                    withCallingCodeButton: true,
                    withCloseButton: true,
                    placeholder: 'Search country',
                    preferredCountries: ['US', 'GB', 'IN', 'CA', 'AU'],
                    modalProps: {
                        animationType: 'slide',
                    },
                    filterProps: {
                        placeholder: 'Search country',
                        autoFocus: true,
                    },
                }}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    phoneContainer: {
        height: 48,
        width: '100%',
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: '#F4F6FA',
        paddingHorizontal: 0,
    },
    textContainer: {
        paddingVertical: 0,
        paddingHorizontal: 0,
        borderRadius: 10,
        backgroundColor: '#F4F6FA',
    },
    textInput: {
        fontSize: 15,
        height: 48,
        paddingVertical: 0,
    },
    codeText: {
        fontSize: 15,
        fontWeight: '500',
    },
    flagButton: {
        marginLeft: 12,
    },
    countryButton: {
        paddingHorizontal: 5,
    },
});

export default CustomPhoneInput;