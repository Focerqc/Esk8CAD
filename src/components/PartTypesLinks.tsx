import React from "react"
import { Button } from "react-bootstrap"

/**
 * PartTypesLinks: Displays all available board platforms/brands.
 * Updated to include the full list of 14 platforms used in the submission form.
 */
const PartTypesLinks: React.FC = () => {
    const platforms = [
        { label: "Street (DIY/Generic)", href: "/parts/street" },
        { label: "Off-Road (DIY/Generic)", href: "/parts/offroad" },
        { label: "Misc", href: "/parts/misc" },
        { label: "3D Servisas", href: "/parts/3dservisas" },
        { label: "Acedeck", href: "/parts/acedeck" },
        { label: "Apex Boards", href: "/parts/apex" },
        { label: "Backfire", href: "/parts/backfire" },
        { label: "Bioboards", href: "/parts/bioboards" },
        { label: "Boardnamics", href: "/parts/boardnamics" },
        { label: "Defiant Board Society", href: "/parts/defiant" },
        { label: "Evolve", href: "/parts/evolve" },
        { label: "Exway", href: "/parts/exway" },
        { label: "Fluxmotion", href: "/parts/fluxmotion" },
        { label: "Hoyt St", href: "/parts/hoyt" },
        { label: "Lacroix Boards", href: "/parts/lacroix" },
        { label: "Linnpower", href: "/parts/linnpower" },
        { label: "MBoards", href: "/parts/mboards" },
        { label: "MBS", href: "/parts/mbs" },
        { label: "Meepo", href: "/parts/meepo" },
        { label: "Newbee", href: "/parts/newbee" },
        { label: "Propel", href: "/parts/propel" },
        { label: "Radium Performance", href: "/parts/radium" },
        { label: "Stooge Raceboards", href: "/parts/stooge" },
        { label: "Summerboard", href: "/parts/summerboard" },
        { label: "Trampa Boards", href: "/parts/trampa" },
        { label: "Wowgo", href: "/parts/wowgo" }
    ]

    return (
        <div className="d-flex flex-wrap gap-3 mb-4" style={{ overflow: 'visible' }}>
            {platforms.map(platform => (
                <Button
                    key={platform.href}
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
