import React from "react"
import { Button } from "react-bootstrap"

/**
 * TechnicalTagsLinks: Displays all technical part categories (Tags).
 * Based on the 12+ categories defined in the submission form and system architecture.
 */
const TechnicalTagsLinks: React.FC = () => {
    const tags = [
        "Anti-sink plate", "Battery", "Battery building parts", "Bearing", "BMS", "Bushing", "Charge Port", "Charger case",
        "Complete board", "Connector", "Cover", "Deck", "Drill hole Jig", "Enclosure", "ESC", "Fender", "Foothold / Bindings",
        "Fuse holder", "Gland", "Guard / Bumper", "Headlight", "Heatsink", "Idler", "Motor", "Motor Mount", "Mount",
        "Pulley", "Remote", "Riser", "Shocks / Damper", "Sprocket", "Stand", "Thumbwheel", "Tire", "Truck", "Wheel",
        "Wheel Hub", "Miscellaneous"
    ]

    return (
        <div className="d-flex flex-wrap gap-2 mb-4" style={{ overflow: 'visible' }}>
            {tags.map(tag => (
                <Button
                    key={tag}
                    variant="outline-success"
                    href={`/parts/tags/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-3 py-1 border-1 fw-semibold"
                    style={{
                        fontSize: '0.85rem',
                        minWidth: '100px',
                        flex: '1 0 auto',
                        maxWidth: 'fit-content',
                        transition: 'all 0.15s ease',
                        opacity: 0.8
                    }}
                >
                    {tag}
                </Button>
            ))}
        </div>
    )
}

export default TechnicalTagsLinks
