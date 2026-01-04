import React from 'react';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  return (
    <select 
      className={`${styles.select} ${className}`} 
      {...props} 
    >
      {children}
    </select>
  );
};
