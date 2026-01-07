import { useState, useEffect } from 'react';

export function Switch({ checked, onChange, disabled }) {
    const [isOn, setIsOn] = useState(checked || false);

    useEffect(() => {
        setIsOn(checked);
    }, [checked]);

    const toggle = () => {
        if (disabled) return;
        const newState = !isOn;
        setIsOn(newState);
        if (onChange) onChange(newState);
    };

    return (
        <div
            onClick={toggle}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: '44px',
                height: '24px',
                background: isOn ? '#c471ed' : 'rgba(255,255,255,0.1)',
                borderRadius: '24px',
                position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'background 0.3s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}
        >
            <div
                style={{
                    width: '18px',
                    height: '18px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    left: '3px',
                    transform: isOn ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            />
        </div>
    );
}
