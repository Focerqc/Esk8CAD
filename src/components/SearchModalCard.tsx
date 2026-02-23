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
        else if (d === "Street (DIY/Generic)") url = "/parts/street"
        else if (d === "Off-Road (DIY/Generic)") url = "/parts/offroad"
        else if (d === "Misc") url = "/parts/misc"
        else if (d === "3D Servisas") url = "/parts/3dservisas"
        else if (d === "Acedeck") url = "/parts/acedeck"
        else if (d === "Apex Boards") url = "/parts/apex"
        else if (d === "Backfire") url = "/parts/backfire"
        else if (d === "Bioboards") url = "/parts/bioboards"
        else if (d === "Boardnamics") url = "/parts/boardnamics"
        else if (d === "Defiant Board Society") url = "/parts/defiant"
        else if (d === "Evolve") url = "/parts/evolve"
        else if (d === "Exway") url = "/parts/exway"
        else if (d === "Fluxmotion") url = "/parts/fluxmotion"
        else if (d === "Hoyt St") url = "/parts/hoyt"
        else if (d === "Lacroix Boards") url = "/parts/lacroix"
        else if (d === "Linnpower") url = "/parts/linnpower"
        else if (d === "MBoards") url = "/parts/mboards"
        else if (d === "MBS") url = "/parts/mbs"
        else if (d === "Meepo") url = "/parts/meepo"
        else if (d === "Newbee") url = "/parts/newbee"
        else if (d === "Propel") url = "/parts/propel"
        else if (d === "Radium Performance") url = "/parts/radium"
        else if (d === "Stooge Raceboards") url = "/parts/stooge"
        else if (d === "Summerboard") url = "/parts/summerboard"
        else if (d === "Trampa Boards") url = "/parts/trampa"
        else if (d === "Wowgo") url = "/parts/wowgo"

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
