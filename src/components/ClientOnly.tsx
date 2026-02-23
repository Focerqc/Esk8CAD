import React, { useEffect, useState } from "react"

interface ClientOnlyProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * ClientOnly: Prevents hydration mismatches by only rendering children on the client.
 * Use this for state-dependent UI or blocks that vary between server and client.
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
    const [hasMounted, setHasMounted] = useState(false)
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        setHasMounted(true)
        const timer = setTimeout(() => {
            if (!hasMounted) setTimedOut(true)
        }, 10000)
        return () => clearTimeout(timer)
    }, [hasMounted])

    if (!hasMounted && !timedOut) {
        return <>{fallback}</>
    }

    if (timedOut && !hasMounted) {
        return (
            <div className="py-4 text-center text-danger small bg-dark rounded border border-danger mx-auto my-3" style={{ maxWidth: '400px' }}>
                <strong className="d-block mb-1">Registry Loading Timeout</strong>
                No parts found in registry or script error. Try refreshing.
            </div>
        )
    }

    return <>{children}</>
}

export default ClientOnly
