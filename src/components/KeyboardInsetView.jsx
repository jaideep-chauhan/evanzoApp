import React, { useEffect, useRef, useState } from 'react';
import { View, Keyboard, Platform, LayoutAnimation } from 'react-native';

/**
 * A View that pads its bottom by however much the keyboard covers it, so
 * bottom-anchored content (an input bar, a bottom sheet with a search field)
 * stays above the keyboard.
 *
 * The overlap is measured (this view's bottom vs. the keyboard's top) rather
 * than assumed, because the platforms differ: iOS never resizes for the
 * keyboard; Android 15+ draws edge-to-edge, where "adjustResize" no longer
 * shrinks the window; older Android does resize, and the measured overlap is
 * then 0 so nothing is added twice.
 */
const KeyboardInsetView = ({ style, children, ...rest }) => {
    const ref = useRef(null);
    const [inset, setInset] = useState(0);

    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const apply = (value, event) => {
            if (Platform.OS === 'ios') {
                // Move with the keyboard instead of jumping.
                LayoutAnimation.configureNext({
                    duration: event?.duration || 250,
                    update: { type: LayoutAnimation.Types.keyboard },
                });
            }
            setInset(value);
        };
        const showSub = Keyboard.addListener(showEvt, (event) => {
            const keyboardTop = event?.endCoordinates?.screenY;
            const keyboardHeight = event?.endCoordinates?.height || 0;
            const node = ref.current;
            // measure()'s pageY is relative to the app's root view, which is
            // also what the keyboard's screenY is measured against. (On
            // edge-to-edge Android, measureInWindow leaves out the status bar,
            // so the bar was lifted ~one status bar too little and stayed
            // half behind the keyboard.)
            if (node?.measure && typeof keyboardTop === 'number') {
                node.measure((x, y, width, height, pageX, pageY) => {
                    apply(height > 0 ? Math.max(0, Math.round(pageY + height - keyboardTop)) : keyboardHeight, event);
                });
            } else {
                apply(keyboardHeight, event);
            }
        });
        const hideSub = Keyboard.addListener(hideEvt, (event) => apply(0, event));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    return (
        <View ref={ref} style={[style, inset > 0 && { paddingBottom: inset }]} {...rest}>
            {children}
        </View>
    );
};

export default KeyboardInsetView;
