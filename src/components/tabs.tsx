import { useEffect, useState, type CSSProperties } from "react";

interface TabInfo {
    key: string;
    label: string;
}

function Button(params: { item: TabInfo; setSelectedTab: (value: string) => void; selectedTab: string; }) {
    const buttonStyle: CSSProperties = {
        color: '#ffffff',
        borderWidth: 0,
        cursor: 'pointer',
        minWidth: 120,
    };

    const [isHovered, setHovered] = useState(false);

    return <button
        style={{
            ...buttonStyle,
            backgroundColor: isHovered || params.item.key === params.selectedTab ? '#222222' : '#343434',
        }}
        onClick={() => params.setSelectedTab(params.item.key)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
    >
        {params.item.label}
    </button>;
}

export default function Tabs(params: {
    tabs: TabInfo[];
    children: ({ selectedTab }: { selectedTab: string; }) => React.ReactNode | undefined;
    selectedTab?: string;
    setSelectedTab?: (value: string) => void;
}) {
    const [selectedTab, setSelectedTab] = useState(params.tabs[0].key);

    useEffect(() => {
        if (params.selectedTab && params.selectedTab !== selectedTab) {
            setSelectedTab(params.selectedTab);
        }
    }, [params.selectedTab]);


    useEffect(() => {
        if (params.setSelectedTab) {
            params.setSelectedTab(selectedTab);
        }
    }, [selectedTab]);

    return <div style={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    }}>
        <div style={{
            width: '100%',
            height: 30,
            display: 'flex',
            borderColor: '#242424',
            flexDirection: 'row',
            gap: 2,
        }}>
            {params.tabs.map((tab) => {
                return <Button key={tab.label} item={tab} setSelectedTab={setSelectedTab} selectedTab={selectedTab} />;
            })}
        </div>
        {params.children({ selectedTab })}

    </div>;
}