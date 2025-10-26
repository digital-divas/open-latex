import { useState, type CSSProperties } from "react";
import { getIcon } from "./icon";

interface Item {
    label: string,
    onClick: () => void;
    disabled?: boolean;
    compileButton?: boolean;
}

function Button(params: { item: Item; isCompiling: boolean; }) {
    const buttonStyle: CSSProperties = {
        backgroundColor: 'transparent',
        color: params.item.disabled ? '#aaaaaa' : '#ffffff',
        borderWidth: 0,
        cursor: !params.item.disabled ? 'pointer' : undefined,
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        gap: 4
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
        {(() => {
            if (!params.item.compileButton) {
                return <></>;
            }
            return <>
                <style>{`
                    @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                    }
                `}</style>

                <span style={{
                    display: "flex",
                    animation: params.isCompiling ? "spin 1s linear infinite" : undefined,
                }}>
                    {getIcon('', params.isCompiling ? 'loading' : 'play')}
                </span>
            </>;

        })()}
        {params.item.label}
    </button>;
}

export default function HeaderBar(params: {
    items: Item[];
    isCompiling: boolean;
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
            return <Button key={item.label} item={item} isCompiling={params.isCompiling} />;
        })}
    </div>;
}