import React, { useState } from 'react';

interface TruncatedTextCellProps {
    value: string;
    onExpand: (val: string) => void;
    maxWidth?: string;
}

export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({ value, onExpand, maxWidth = '300px' }) => {
    const [hover, setHover] = useState(false);
    return (
        <td 
            style={{ padding: '8px', color: '#ccc', maxWidth: maxWidth, position: 'relative' }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingRight: '22px' }} title={value}>
                {value}
            </div>
            {hover && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onExpand(value); }}
                    style={{
                        position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                        background: '#333', border: '1px solid #555', color: '#fff', cursor: 'pointer',
                        padding: '2px 6px', borderRadius: '3px', fontSize: '10px', zIndex: 10
                    }}
                    title="View Full Content"
                >
                    <i className="fas fa-expand"></i>
                </button>
            )}
        </td>
    );
};
