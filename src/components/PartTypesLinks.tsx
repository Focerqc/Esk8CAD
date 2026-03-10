import React, { useState, useEffect } from "react"
import { Button } from "react-bootstrap"
import { getSupabaseClient } from "../lib/supabase"

/**
 * PartTypesLinks: Displays all available board platforms/brands.
 * Updated to dynamically resolve platforms from the database.
 */
const PartTypesLinks: React.FC = () => {
    const DEFAULT_PLATFORMS = [
        { label: "Street (DIY/Generic)", href: "/parts?brand=Street%20(DIY/Generic)" },
        { label: "Off-Road (DIY/Generic)", href: "/parts?brand=Off-Road%20(DIY/Generic)" },
        { label: "Misc", href: "/parts?brand=Misc" },
        { label: "3D Servisas", href: "/parts?brand=3D%20Servisas" },
        { label: "Acedeck", href: "/parts?brand=Acedeck" },
        { label: "Apex Boards", href: "/parts?brand=Apex%20Boards" },
        { label: "Backfire", href: "/parts?brand=Backfire" },
        { label: "Bioboards", href: "/parts?brand=Bioboards" },
        { label: "Boardnamics", href: "/parts?brand=Boardnamics" },
        { label: "Defiant Board Society", href: "/parts?brand=Defiant%20Board%20Society" },
        { label: "Evolve", href: "/parts?brand=Evolve" },
        { label: "Exway", href: "/parts?brand=Exway" },
        { label: "Fluxmotion", href: "/parts?brand=Fluxmotion" },
        { label: "Hoyt St", href: "/parts?brand=Hoyt%20St" },
        { label: "Lacroix Boards", href: "/parts?brand=Lacroix%20Boards" },
        { label: "Linnpower", href: "/parts?brand=Linnpower" },
        { label: "MBoards", href: "/parts?brand=MBoards" },
        { label: "MBS", href: "/parts?brand=MBS" },
        { label: "Meepo", href: "/parts?brand=Meepo" },
        { label: "Newbee", href: "/parts?brand=Newbee" },
        { label: "Propel", href: "/parts?brand=Propel" },
        { label: "Radium Performance", href: "/parts?brand=Radium%20Performance" },
        { label: "Stooge Raceboards", href: "/parts?brand=Stooge%20Raceboards" },
        { label: "Summerboard", href: "/parts?brand=Summerboard" },
        { label: "Trampa Boards", href: "/parts?brand=Trampa%20Boards" },
        { label: "Wowgo", href: "/parts?brand=Wowgo" }
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
                            href: existingStatic ? existingStatic.href : `/parts?brand=${encodeURIComponent(p.name)}`
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
