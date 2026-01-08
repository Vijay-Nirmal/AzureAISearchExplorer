import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoIcon.module.css';

interface InfoIconProps {
    tooltip: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ tooltip }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const anchorRef = useRef<HTMLSpanElement | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(null);

    const tooltipText = useMemo(() => (tooltip || '').trim(), [tooltip]);

    const updateTooltipPosition = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const tooltipWidth = 320; // keeps things stable before measuring
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const centerX = rect.left + rect.width / 2;
        const left = Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - margin));

        // Prefer showing above; if not enough space, show below.
        const preferTop = rect.top > 100;
        const placement: 'top' | 'bottom' = preferTop ? 'top' : 'bottom';

        let top = rect.top - margin;
        if (placement === 'top') {
            top = rect.top - margin;
        } else {
            top = rect.bottom + margin;
        }

        // Clamp for safety
        top = Math.max(margin, Math.min(top, viewportHeight - margin));

        setTooltipPos({ left, top, placement });
    };

    useLayoutEffect(() => {
        if (!showTooltip) return;
        updateTooltipPosition();
    }, [showTooltip]);

    useEffect(() => {
        if (!showTooltip) return;

        let rafId = 0;
        const scheduleUpdate = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateTooltipPosition);
        };

        window.addEventListener('resize', scheduleUpdate);
        // capture=true catches scrolls from nested containers (e.g., modal bodies)
        window.addEventListener('scroll', scheduleUpdate, true);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('scroll', scheduleUpdate, true);
        };
    }, [showTooltip]);

    return (
        <span 
            ref={anchorRef}
            className={styles.infoIcon}
            onMouseEnter={() => {
                if (!tooltipText) return;
                setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <i className="fas fa-info-circle"></i>
            {showTooltip && tooltipPos && createPortal(
                <div
                    className={styles.tooltip}
                    data-placement={tooltipPos.placement}
                    style={{
                        left: tooltipPos.left,
                        top: tooltipPos.placement === 'top' ? tooltipPos.top : tooltipPos.top,
                    }}
                    role="tooltip"
                >
                    {tooltipText}
                </div>,
                document.body
            )}
        </span>
    );
};
