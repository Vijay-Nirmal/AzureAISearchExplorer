import React from 'react';

export interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
    active?: boolean;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <div className="breadcrumbs" style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center' }}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <i className="fas fa-chevron-right" style={{ fontSize:'10px', margin:'0 6px' }}></i>}
                    <span 
                        style={{ 
                            cursor: item.onClick ? 'pointer' : 'default',
                            fontWeight: item.active ? 600 : 400,
                            color: item.active ? 'var(--text-color)' : 'inherit'
                         }} 
                        onClick={item.onClick}
                    >
                        {item.label}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};
