import { useEffect, useState } from 'react';

export function Switch({ checked, onChange, disabled }) {
    const [isOn, setIsOn] = useState(checked || false);

    useEffect(() => {
        setIsOn(Boolean(checked));
    }, [checked]);

    const toggle = () => {
        if (disabled) return;
        const nextState = !isOn;
        setIsOn(nextState);
        onChange?.(nextState);
    };

    return (
        <button
            type="button"
            onClick={toggle}
            className={`app-switch ${isOn ? 'is-on' : ''}`}
            disabled={disabled}
            role="switch"
            aria-checked={isOn}
        >
            <span className="app-switch-thumb" />
        </button>
    );
}
