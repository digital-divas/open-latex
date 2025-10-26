import { useState, type CSSProperties } from "react";

interface Item {
    label: string,
    onClick: () => void;
    disabled?: boolean;
}

function Button(params: { item: Item; }) {
    const buttonStyle: CSSProperties = {
        backgroundColor: 'transparent',
        color: params.item.disabled ? '#aaaaaa' : '#ffffff',
        borderWidth: 0,
        cursor: !params.item.disabled ? 'pointer' : undefined,
    };

    const [isHovered, setHovered] = useState(false);

    return <button
        style={{
            ...buttonStyle,
            backgroundColor: isHovered && !params.item.disabled ? '#222222' : 'transparent',
        }}
        onClick={params.item.disabled ? () => { } : params.item.onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
    >
        {params.item.label}
    </button>;
}

export default function HeaderBar(params: {
    items: Item[];
}) {

    return <div style={{
        height: 25,
        width: '100%',
        display: 'flex',
        flex: 1,
        gap: 10,
        flexDirection: 'row',
        backgroundColor: '#333333',
    }}>
        {params.items.map((item) => {
            return <Button key={item.label} item={item} />;
        })}
    </div>;
}