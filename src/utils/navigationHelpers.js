// Back button that always goes somewhere. A screen opened from a shared link
// with the app closed is the only route in the stack, so goBack() did
// nothing — fall back to the home tabs instead.
export const goBackOrHome = (navigation) => {
    if (!navigation) return;
    if (navigation.canGoBack?.()) {
        navigation.goBack();
    } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
};
