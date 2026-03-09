import React from "react"

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/link | React-Bootstrap Link}
 * with item information from an {@link ItemData}
 * or {@link ResourceData} object array. Intended
 * to be used in conjunction with the Array map
 * function.
 * 
 * @param item - an {@link ItemData} or {@link ResourceData} object
 * @param index - a number from a map
 */
export default (item: ItemData | ResourceData, index: number) => {
    const getLinks = (d: string) => {
        let url = ""

        // Resources
        if (d.includes("App")) url = "/resources/applications"
        else if (d.includes("Github Repository")) url = "/resources/repositories"
        else if (d.includes("Spreadsheet")) url = "/resources/spreadsheets"
        else if (d.includes("Vendor")) url = "/resources/vendors"
        else if (d.includes("Video Guide")) url = "/resources/videoguides"
        else if (d.includes("Website")) url = "/resources/websites"
        else if (d.includes("Written Guide")) url = "/resources/writtenguides"

        // Platforms (Mappings)
        else if (d === "Street (DIY/Generic)") url = "/street"
        else if (d === "Off-Road (DIY/Generic)") url = "/offroad"
        else if (d === "Misc") url = "/misc"
        else if (d === "3D Servisas") url = "/3dservisas"
        else if (d === "Acedeck") url = "/acedeck"
        else if (d === "Apex Boards") url = "/apex"
        else if (d === "Backfire") url = "/backfire"
        else if (d === "Bioboards") url = "/bioboards"
        else if (d === "Boardnamics") url = "/boardnamics"
        else if (d === "Defiant Board Society") url = "/defiant"
        else if (d === "Evolve") url = "/evolve"
        else if (d === "Exway") url = "/exway"
        else if (d === "Fluxmotion") url = "/fluxmotion"
        else if (d === "Hoyt St") url = "/hoyt"
        else if (d === "Lacroix Boards") url = "/lacroix"
        else if (d === "Linnpower") url = "/linnpower"
        else if (d === "MBoards") url = "/mboards"
        else if (d === "MBS") url = "/mbs"
        else if (d === "Meepo") url = "/meepo"
        else if (d === "Newbee") url = "/newbee"
        else if (d === "Propel") url = "/propel"
        else if (d === "Radium Performance") url = "/radium"
        else if (d === "Stooge Raceboards") url = "/stooge"
        else if (d === "Summerboard") url = "/summerboard"
        else if (d === "Trampa Boards") url = "/trampa"
        else if (d === "Wowgo") url = "/wowgo"

        return url ? (url + `?search=${encodeURIComponent(item.title)}`) : "#"
    }

    return (
        <div
            className="searchableThing"
            style={{ display: "none" }}
            key={`search-modal-card-${index}`}>
            {item.title} <>(</>{
                ((item as ItemData).platform ?? (item as ResourceData).typeOfResource)
                    .map<React.ReactNode>((i) => (
                        <a
                            href={getLinks(i)}
                            target="_self"
                            key={`thing-card-${index}-${i}`}>
                            {i}
                        </a>
                    ))
                    .reduce((p, c) => [p, " | ", c])
            }<>)</>
        </div>
    )
}
