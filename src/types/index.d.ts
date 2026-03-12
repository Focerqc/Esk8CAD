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
