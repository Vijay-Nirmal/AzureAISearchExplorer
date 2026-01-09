import React from 'react';
import type { SearchIndex } from '../../../types/IndexModels';

interface IndexTokenFiltersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

export const IndexTokenFiltersTab: React.FC<IndexTokenFiltersTabProps> = () => {
    return (
        <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
            <div style={{ color: 'var(--text-muted-color)' }}>
                Token filters editor coming soon.
            </div>
        </div>
    );
};
