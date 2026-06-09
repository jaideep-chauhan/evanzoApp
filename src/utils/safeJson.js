/**
 * Safe JSON parsing utilities to prevent app crashes from malformed JSON data
 */

/**
 * Safely parse JSON string with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - Default value to return if parsing fails (default: null)
 * @returns {*} Parsed object or defaultValue if parsing fails
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
    if (jsonString === null || jsonString === undefined) {
        return defaultValue;
    }

    if (typeof jsonString !== 'string') {
        // If it's already an object, return it
        if (typeof jsonString === 'object') {
            return jsonString;
        }
        return defaultValue;
    }

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        if (__DEV__) {
            console.warn('[safeJsonParse] Failed to parse JSON:', error.message);
        }
        return defaultValue;
    }
};

/**
 * Safely stringify object to JSON with error handling
 * @param {*} value - The value to stringify
 * @param {string} defaultValue - Default value to return if stringify fails (default: '{}')
 * @returns {string} JSON string or defaultValue if stringify fails
 */
export const safeJsonStringify = (value, defaultValue = '{}') => {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    try {
        return JSON.stringify(value);
    } catch (error) {
        if (__DEV__) {
            console.warn('[safeJsonStringify] Failed to stringify:', error.message);
        }
        return defaultValue;
    }
};

/**
 * Safely parse JSON with type validation
 * @param {string} jsonString - The JSON string to parse
 * @param {string} expectedType - Expected type ('object', 'array')
 * @param {*} defaultValue - Default value to return if parsing fails
 * @returns {*} Parsed value or defaultValue
 */
export const safeJsonParseTyped = (jsonString, expectedType, defaultValue) => {
    const parsed = safeJsonParse(jsonString, defaultValue);

    if (expectedType === 'array') {
        return Array.isArray(parsed) ? parsed : (defaultValue ?? []);
    }

    if (expectedType === 'object') {
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
            ? parsed
            : (defaultValue ?? {});
    }

    return parsed;
};

export default {
    parse: safeJsonParse,
    stringify: safeJsonStringify,
    parseTyped: safeJsonParseTyped,
};
