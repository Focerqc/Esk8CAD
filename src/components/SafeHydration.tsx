import React, { useState, useEffect, ReactNode } from 'react';

// Next.js style Safe Hydration to ensure a component only renders 
// after mounting on the client, avoiding hydration mismatches.
// Can also be used to explicitly defer rendering heavy client-only 
// components until after the first paint.
export default function SafeHydration({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
