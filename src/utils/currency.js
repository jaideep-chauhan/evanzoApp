import * as RNLocalize from 'react-native-localize';

// Supported currencies for ad pricing (budget / offer). Multi-country app, so
// users pick the unit that matches where they are. `code` is the ISO 4217 code
// stored in the backend (STRING(3)); `symbol` is what we render in the UI.
export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

const CURRENCY_BY_CODE = CURRENCIES.reduce((acc, c) => {
    acc[c.code] = c;
    return acc;
}, {});

export const DEFAULT_CURRENCY = 'USD';

// Look up the display symbol for a currency code. Falls back to the raw code
// (e.g. an unknown/legacy value) so we never render "undefined".
export const getCurrencySymbol = (code) => {
    if (!code) return CURRENCY_BY_CODE[DEFAULT_CURRENCY].symbol;
    return CURRENCY_BY_CODE[code]?.symbol || code;
};

export const getCurrencyMeta = (code) =>
    CURRENCY_BY_CODE[code] || CURRENCY_BY_CODE[DEFAULT_CURRENCY];

// Detect the user's currency from the device locale, falling back to USD. Only
// returns a code we actually support so the dropdown always has a valid match.
export const detectDefaultCurrency = () => {
    try {
        const codes = RNLocalize.getCurrencies?.() || [];
        const supported = codes.find((c) => CURRENCY_BY_CODE[c]);
        return supported || DEFAULT_CURRENCY;
    } catch (e) {
        return DEFAULT_CURRENCY;
    }
};

// Format an amount with its currency symbol, e.g. formatAmount(5, 'INR') => "₹5".
export const formatAmount = (amount, code) => {
    const symbol = getCurrencySymbol(code);
    if (amount == null || amount === '') return symbol;
    return `${symbol}${amount}`;
};
