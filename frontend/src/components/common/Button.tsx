import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'secondary', 
  className = '', 
  icon,
  ...props 
}) => {
  const variantClass = styles[variant] || styles.secondary;
  
  return (
    <button 
      className={`${styles.button} ${variantClass} ${className}`} 
      {...props}
    >
      {icon && <span className={styles.iconWrapper}>{icon}</span>}
      {children}
    </button>
  );
};
