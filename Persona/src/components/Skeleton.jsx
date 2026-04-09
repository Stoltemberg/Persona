export function Skeleton({ width, height, borderRadius = '8px', className = '', style = {} }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    );
}
