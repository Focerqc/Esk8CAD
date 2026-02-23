interface ItemData {
    id?: any;
    /**
     * Item title text
     */
    title: string
    /**
     * Item fabrication method
     */
    fabricationMethod: FabricationMethod[]
    /**
     * Item type
     */
    typeOfPart: PartType[]
    /**
     * Image source url
     */
    imageSrc: string
    /**
     * Platform type
     */
    platform: PlatformType[]
    /**
     * Item external URL
     */
    externalUrl?: string
    /**
     * Item ZIP direct download URL
     */
    dropboxUrl?: string
    /**
     * Item ZIP direct download last updated
     */
    dropboxZipLastUpdated: string,
    isOem?: boolean
    parent?: {
        relativePath: string
    }
}

type PartType =
    | "Truck"
    | "Bushing"
    | "Bearing"
    | "Wheel"
    | "Tire"
    | "Wheel Hub"
    | "Pulley"
    | "Sprocket"
    | "Idler"
    | "Thumbwheel"
    | "Motor Mount"
    | "Mount"
    | "Anti-sink plate"
    | "Riser"
    | "Deck"
    | "Foothold / Bindings"
    | "Motor"
    | "Battery"
    | "BMS"
    | "ESC"
    | "Charger case"
    | "Charge Port"
    | "Connector"
    | "Fuse holder"
    | "Battery building parts"
    | "Enclosure"
    | "Cover"
    | "Fender"
    | "Guard / Bumper"
    | "Heatsink"
    | "Gland"
    | "Headlight"
    | "Remote"
    | "Shocks / Damper"
    | "Drill hole Jig"
    | "Stand"
    | "Complete board"
    | "Miscellaneous"

type FabricationMethod =
    | "3d Printed"
    | "CNC"
    | "Laser"
    | "Other"
    | "PCB"

type PlatformType =
    | "Street (DIY/Generic)"
    | "Off-Road (DIY/Generic)"
    | "Misc"
    | "3D Servisas"
    | "Acedeck"
    | "Apex Boards"
    | "Backfire"
    | "Bioboards"
    | "Boardnamics"
    | "Defiant Board Society"
    | "Evolve"
    | "Exway"
    | "Fluxmotion"
    | "Hoyt St"
    | "Lacroix Boards"
    | "Linnpower"
    | "MBoards"
    | "MBS"
    | "Meepo"
    | "Newbee"
    | "Propel"
    | "Radium Performance"
    | "Stooge Raceboards"
    | "Summerboard"
    | "Trampa Boards"
    | "Wowgo"

interface ResourceData {
    /**
     * Resource title text
     */
    title: string
    /**
     * Resource type
     */
    typeOfResource: ResourceType[]
    /**
     * Resource external URL
     */
    externalUrl?: string
    /**
     * Apple App Store link
     */
    appStoreLink?: string
    /**
     * Google Play Store link
     */
    playStoreLink?: string
    /**
     * Resource description text
     */
    description?: string
}

type ResourceType =
    | "App"
    | "Github Repository"
    | "Written Guide"
    | "Video Guide"
    | "Spreadsheet"
    | "Vendor"
    | "Website"

interface PartsShopData {
    /**
     * Item title text
     */
    title: string
    /**
     * Item type
     */
    typeOfPart: PartShopType[]
    /**
     * Platform type
     */
    platform: PlatformType[]
    /**
     * How many of these are left
     */
    availableCount: number
    /**
     * Item price number
     */
    price: number
    /**
     * Item description text
     */
    condition: ItemCondition
    /**
     * Image source url
     */
    imageSrc?: string | string[]
    /**
     * Item description text
     */
    description?: string
    /**
     * Item external URL
     */
    externalUrl?: string
    /**
     * Present this item at the top of the shop listings
     */
    featured?: boolean
}

type PartShopType =
    | PartType
    | "Axle Block Attachment"
    | "Battery"
    | "Bolt"
    | "Charger"
    | "Complete Board"
    | "Display"
    | "Sensor"

type ItemCondition =
    | "New"
    | "Like New"
    | "Used"
    | "For Parts"
