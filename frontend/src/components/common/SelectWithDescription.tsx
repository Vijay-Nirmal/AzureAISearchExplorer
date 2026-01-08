import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SelectWithDescription.module.css';

export interface SelectOption {
    value: string;
    description?: string;
    label?: string; // Optional override for what's shown in the main text
}

interface SelectWithDescriptionProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    options: (string | SelectOption)[];
    separator?: string; // Default: " - "
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

export const SelectWithDescription: React.FC<SelectWithDescriptionProps> = ({ 
    options, 
    separator = " - ",
    className,
    ...props 
}) => {
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState<number>(-1);
    const [menuPos, setMenuPos] = useState<{
        left: number;
        top: number;
        width: number;
        maxHeight: number;
        placement: 'bottom' | 'top';
    } | null>(null);

    // Helper to normalize options
    const normalizedOptions = useMemo(() => {
        return options.map(opt => {
            if (typeof opt === 'string') {
                return { value: opt, description: undefined, label: opt };
            }
            return { value: opt.value, description: opt.description, label: opt.label };
        });
    }, [options]);

    const value = (props.value ?? props.defaultValue ?? '') as string;
    const disabled = !!props.disabled;

    const selected = useMemo(() => {
        return normalizedOptions.find(o => o.value === value);
    }, [normalizedOptions, value]);

    const selectedText = selected?.label || selected?.value || (value ? String(value) : '');

    const close = () => {
        setIsOpen(false);
        setHighlightIndex(-1);
    };

    const open = () => {
        if (disabled) return;
        setIsOpen(true);
        const selectedIdx = normalizedOptions.findIndex(o => o.value === value);
        setHighlightIndex(selectedIdx >= 0 ? selectedIdx : 0);
    };

    const toggle = () => {
        if (isOpen) close();
        else open();
    };

    const commitValue = useCallback((newValue: string) => {
        if (disabled) return;
        const syntheticEvent = {
            target: { value: newValue }
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        props.onChange?.(syntheticEvent);
        close();
    }, [disabled, props]);

    const updateMenuPosition = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom - margin;
        const spaceAbove = rect.top - margin;
        const preferredMax = 320;

        const placeBottom = spaceBelow >= 180 || spaceBelow >= spaceAbove;
        const placement: 'bottom' | 'top' = placeBottom ? 'bottom' : 'top';
        const maxHeight = Math.max(120, Math.min(preferredMax, placement === 'bottom' ? spaceBelow : spaceAbove));
        const left = Math.max(margin, Math.min(rect.left, window.innerWidth - rect.width - margin));
        const top = placement === 'bottom' ? rect.bottom + 4 : rect.top - 4;

        setMenuPos({ left, top, width: rect.width, maxHeight, placement });
    };

    useLayoutEffect(() => {
        if (!isOpen) return;
        updateMenuPosition();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let rafId = 0;
        const scheduleUpdate = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateMenuPosition);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightIndex(i => Math.min(normalizedOptions.length - 1, Math.max(0, i + 1)));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightIndex(i => Math.max(0, i - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const opt = normalizedOptions[highlightIndex];
                if (opt) commitValue(opt.value);
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            const anchor = anchorRef.current;
            const target = e.target as Node;
            if (anchor && anchor.contains(target)) return;
            // clicks inside portal menu will be handled by stopPropagation
            close();
        };

        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('scroll', scheduleUpdate, true);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onMouseDown);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('scroll', scheduleUpdate, true);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onMouseDown);
        };
    }, [isOpen, highlightIndex, normalizedOptions, commitValue]);

    const handleControlKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
        if (disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            open();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

    return (
        <div className={styles.selectContainer} ref={anchorRef}>
            <button
                type="button"
                className={`${styles.control} ${className || ''}`}
                onClick={toggle}
                onKeyDown={handleControlKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={styles.value} title={selectedText}>
                    {selectedText || ''}
                </span>
                <span className={styles.chevron} aria-hidden="true">
                    <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </span>
            </button>

            {isOpen && menuPos && createPortal(
                <div
                    className={styles.menu}
                    role="listbox"
                    style={{
                        left: menuPos.left,
                        top: menuPos.placement === 'bottom' ? menuPos.top : undefined,
                        bottom: menuPos.placement === 'top' ? window.innerHeight - menuPos.top : undefined,
                        width: menuPos.width,
                        maxHeight: menuPos.maxHeight
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {normalizedOptions.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        const isHighlighted = idx === highlightIndex;
                        return (
                            <div
                                key={`${opt.value}-${idx}`}
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isHighlighted ? styles.optionHighlighted : ''}`}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                onClick={() => commitValue(opt.value)}
                            >
                                <div className={styles.optionValue}>{opt.label || opt.value}</div>
                                {opt.description && (
                                    <div className={styles.optionDescription}>{opt.description}</div>
                                )}
                            </div>
                        );
                    })}

                    {/* Keep separator prop to avoid breaking API; used only for native select mode previously */}
                    {separator && null}
                </div>,
                document.body
            )}
        </div>
    );
};
