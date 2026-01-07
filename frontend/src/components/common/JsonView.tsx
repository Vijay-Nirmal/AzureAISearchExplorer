import React, { ComponentProps } from 'react';
import Editor from '@monaco-editor/react';

type EditorProps = ComponentProps<typeof Editor>;

interface JsonViewProps extends Omit<EditorProps, 'language' | 'value'> {
    data: any;
    height?: string | number;
    readOnly?: boolean;
}

export const JsonView: React.FC<JsonViewProps> = ({ 
    data, 
    height = '100%', 
    readOnly = true, 
    options,
    ...props 
}) => {
    // If data is a string, assume it might be JSON or just text. 
    // If it's an object, stringify it.
    const value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return (
        <Editor
            height={height}
            defaultLanguage="json"
            value={value}
            theme="vs-dark"
            options={{
                readOnly: readOnly,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                automaticLayout: true,
                ...options
            }}
            {...props}
        />
    );
};
