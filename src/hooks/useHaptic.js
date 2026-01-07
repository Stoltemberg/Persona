export function useHaptic() {
    const light = () => {
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const medium = () => {
        if (navigator.vibrate) navigator.vibrate(40);
    };

    const heavy = () => {
        if (navigator.vibrate) navigator.vibrate(100);
    };

    const success = () => {
        if (navigator.vibrate) navigator.vibrate([10, 50, 20]);
    };

    return { light, medium, heavy, success };
}
