import React, { useState, useEffect } from "react"
import { Button } from "react-bootstrap"
import { getSupabaseClient } from "../lib/supabase"

/**
 * PartTypesLinks: Displays all available board platforms/brands.
 * Updated to dynamically resolve platforms from the database.
 */
const PartTypesLinks: React.FC = () => {
    const DEFAULT_PLATFORMS = [
        { label: "Street (DIY/Generic)", href: "/street" },
        { label: "Off-Road (DIY/Generic)", href: "/offroad" },
        { label: "Misc", href: "/misc" },
        { label: "3D Servisas", href: "/3dservisas" },
        { label: "Acedeck", href: "/acedeck" },
        { label: "Apex Boards", href: "/apex" },
        { label: "Backfire", href: "/backfire" },
        { label: "Bioboards", href: "/bioboards" },
        { label: "Boardnamics", href: "/boardnamics" },
        { label: "Defiant Board Society", href: "/defiant" },
        { label: "Evolve", href: "/evolve" },
        { label: "Exway", href: "/exway" },
        { label: "Fluxmotion", href: "/fluxmotion" },
        { label: "Hoyt St", href: "/hoyt" },
        { label: "Lacroix Boards", href: "/lacroix" },
        { label: "Linnpower", href: "/linnpower" },
        { label: "MBoards", href: "/mboards" },
        { label: "MBS", href: "/mbs" },
        { label: "Meepo", href: "/meepo" },
        { label: "Newbee", href: "/newbee" },
        { label: "Propel", href: "/propel" },
        { label: "Radium Performance", href: "/radium" },
        { label: "Stooge Raceboards", href: "/stooge" },
        { label: "Summerboard", href: "/summerboard" },
        { label: "Trampa Boards", href: "/trampa" },
        { label: "Wowgo", href: "/wowgo" }
    ];

    const [platforms, setPlatforms] = useState<{ label: string, href: string }[]>(DEFAULT_PLATFORMS)

    useEffect(() => {
        let isMounted = true;
        const fetchPlatforms = async () => {
            try {
                const client = getSupabaseClient();
                if (!client) return;
                const { data } = await client.from('brands').select('name').order('name');
                if (data && data.length > 0 && isMounted) {
                    const dynamicPlatforms = data.map(p => {
                        const existingStatic = DEFAULT_PLATFORMS.find(dp => dp.label === p.name);
                        return {
                            label: p.name,
                            href: existingStatic ? existingStatic.href : `/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
                        };
                    });
                    setPlatforms(dynamicPlatforms);
                }
            } catch (e) {
                console.error("Failed to dynamically load platforms", e);
            }
        };
        fetchPlatforms();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="d-flex flex-wrap gap-3 mb-4" style={{ overflow: 'visible' }}>
            {platforms.map(platform => (
                <Button
                    key={platform.label}
                    variant="outline-info"
                    href={platform.href}
                    className="px-4 py-2 border-2 fw-bold"
                    style={{
                        fontSize: '0.95rem',
                        minWidth: '140px',
                        flex: '1 0 auto',
                        maxWidth: 'fit-content',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {platform.label}
                </Button>
            ))}
        </div>
    )
}

export default PartTypesLinks
