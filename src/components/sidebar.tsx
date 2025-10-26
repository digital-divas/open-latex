import { type ReactNode } from 'react';

export const Sidebar = ({ children }: { children: ReactNode; }) => {
    return (
        <aside style={{
            display: 'block',
            width: 250,
            borderRightStyle: 'solid',
            borderRightWidth: 2,
            borderColor: '#242424',
            paddingTop: 3,

        }}>
            {children}
        </aside>
    );
};

export default Sidebar;
