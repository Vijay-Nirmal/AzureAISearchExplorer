import React from 'react';
import styles from './TextArea.module.css';

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => {
  return <textarea className={`${styles.textArea} ${className}`} {...props} />;
};
