// One-shot bridge for handing a keyword / category back from the standalone
// Search screen to whichever list screen opened it. The list screen registers
// a handler right before navigating; the Search screen pops + invokes it on
// submit. Avoids forcing every Tab/Stack nesting layer to thread params.

let pending = null;

export const setSearchHandler = (handler) => {
    pending = handler;
};

export const popSearchHandler = () => {
    const handler = pending;
    pending = null;
    return handler;
};

export default { setSearchHandler, popSearchHandler };
