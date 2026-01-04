import React from 'react';
import styles from './Label.module.css';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => {
  return (
    <label className={`${styles.label} ${className}`} {...props}>
      {children}
    </label>
  );
};
