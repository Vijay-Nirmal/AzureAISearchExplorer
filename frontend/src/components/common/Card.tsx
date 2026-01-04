import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', style }) => {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {title && <h2 className={styles.header}>{title}</h2>}
      {children}
    </div>
  );
};
