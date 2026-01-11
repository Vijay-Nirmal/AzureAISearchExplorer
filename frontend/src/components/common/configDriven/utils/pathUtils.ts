export type PathObject = Record<string, unknown>;

const splitPath = (path: string): string[] => {
    const t = String(path || '');
    if (!t) return [];
    // Treat OData/@-prefixed keys as literal (e.g. "@odata.type"), not as dot paths.
    if (t.startsWith('@')) return [t];
    return t.split('.').filter(Boolean);
};

export const getByPath = (obj: PathObject, path: string): unknown => {
    const parts = splitPath(path);
    if (parts.length === 0) return undefined;

    let cur: unknown = obj;
    for (const p of parts) {
        if (typeof cur !== 'object' || cur === null) return undefined;

        if (Array.isArray(cur)) {
            const idx = Number(p);
            if (!Number.isInteger(idx)) return undefined;
            cur = cur[idx];
            continue;
        }

        cur = (cur as PathObject)[p];
    }
    return cur;
};

export const setByPath = (obj: PathObject, path: string, value: unknown): PathObject => {
    const parts = splitPath(path);
    if (parts.length === 0) return obj;

    const next: PathObject = { ...obj };
    let cur: PathObject = next;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const existing = cur[key];
        const child = existing && typeof existing === 'object' && !Array.isArray(existing)
            ? { ...(existing as PathObject) }
            : {};
        cur[key] = child;
        cur = child;
    }

    cur[parts[parts.length - 1]] = value;
    return next;
};

export const deleteByPath = (obj: PathObject, path: string): PathObject => {
    const parts = splitPath(path);
    if (parts.length === 0) return obj;

    const next: PathObject = { ...obj };
    let cur: PathObject = next;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const existing = cur[key];
        if (!existing || typeof existing !== 'object' || Array.isArray(existing)) return obj;
        const child = { ...(existing as PathObject) };
        cur[key] = child;
        cur = child;
    }

    delete cur[parts[parts.length - 1]];
    return next;
};
