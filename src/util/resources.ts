const allResources = [
    {
        title: "VESC Tool",
        typeOfResource: ["App"],
        appStoreLink: "https://apps.apple.com/us/app/id1605488891",
        playStoreLink: "https://play.google.com/store/apps/details?id=vedder.vesctool",
        description: "This is the mobile version of VESC Tool, which can be used to configure VESC®-based hardware over BLE"
    },
    {
        title: "Float Control: VESC Companion",
        typeOfResource: ["App"],
        appStoreLink: "https://apps.apple.com/us/app/id1590924299",
        description: "Connect to your VESC®-based esk8 skateboard builds via Bluetooth to monitor statistics such as voltage, amps, speed and many more."
    },
    {
        title: "Benjamin Vedder's Collection",
        typeOfResource: ["Github Repository"],
        externalUrl: "https://github.com/vedderb?tab=repositories",
        description: "All things VESC"
    },
    {
        title: "Motor Crunch Troubleshooting Guide",
        typeOfResource: ["Written Guide"],
        externalUrl: "https://pev.dev/t/motor-crunch-troubleshooting/228",
        description: "Does your motor make crunchy/cogging sounds when braking hard or accelerating?"
    },
    {
        title: "TheBoardGarage Articles",
        typeOfResource: ["Written Guide"],
        externalUrl: "https://theboardgarage.com/articles",
        description: "Collection of battery related guides and articles for high-performance builds"
    },
    {
        title: "How to Create CSV Logs",
        typeOfResource: ["Written Guide"],
        externalUrl: "https://pev.dev/t/how-to-create-csv-logs/436",
        description: "A guide to create CSV logs in VESC Tool App"
    },
    {
        title: "VESC Logs Tutorial",
        typeOfResource: ["Written Guide"],
        externalUrl: "https://docs.google.com/document/d/1DZV0oKDQWWqWCkOSJJDLrGvE0EA0v4Gj1mitOXhpvyM/edit",
        description: "How to view and analyze VESC Logs"
    },
    {
        title: "Soldering 101",
        typeOfResource: ["Video Guide"],
        externalUrl: "https://www.youtube.com/watch?v=ez99VcGNFJc",
        description: "A comprehensive guide to soldering for PEV builds"
    },
    {
        title: "All Things VESC Battery Comparison",
        typeOfResource: ["Spreadsheet"],
        externalUrl: "https://docs.google.com/spreadsheets/d/1EPqBROovzQ03iRKpK6Xfy0T7oEG6ZpiBP0-BecQBbUA/edit",
        description: "Battery pack data comparison tool for various controllers and battery configurations"
    },
    {
        title: "PEV.dev",
        typeOfResource: ["Website"],
        externalUrl: "https://pev.dev/",
        description: "A place to share information and ideas about DIY PEVs"
    },
    {
        title: "ESC Log Video",
        typeOfResource: ["Website"],
        externalUrl: "https://lachlanhurst.github.io/esc-log-video/",
        description: "Tool for generating data overlay videos from VESC log files"
    },
    {
        title: "Spintend",
        typeOfResource: ["Vendor"],
        externalUrl: "https://spintend.com/",
        description: "Parts and controllers for PEVs"
    },
    {
        title: "Ennoid",
        typeOfResource: ["Vendor"],
        externalUrl: "https://www.ennoid.me/home",
        description: "EV components & high-voltage BMS solutions"
    },
    {
        title: "Z Battery Solutions",
        typeOfResource: ["Vendor"],
        externalUrl: "https://zbattery.solutions/",
        description: "Custom high-performance battery packs"
    }
] as ResourceData[]

const resource = (resourceType: ResourceType) => {
    return allResources
        .filter((p) => p.typeOfResource.includes(resourceType))
        .sort((a, b) => a.title.localeCompare(b.title))
}

export default allResources
export const applicationsResources = resource("App")
export const codeRepositoriesResources = resource("Github Repository")
export const spreadsheetsResources = resource("Spreadsheet")
export const vendorsResources = resource("Vendor")
export const videoGuidesResources = resource("Video Guide")
export const websitesResources = resource("Website")
export const writtenGuidesResources = resource("Written Guide")
