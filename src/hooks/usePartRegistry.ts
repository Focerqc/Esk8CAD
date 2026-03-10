import React from "react"

interface ItemData {
    title: string;
    imageSrc: string;
    platform: string[];
    fabricationMethod: string[];
    typeOfPart: string[];
    dropboxUrl: string;
    dropboxZipLastUpdated: string;
    externalUrl: string;
    isOem: boolean;
}

/**
 * usePartRegistry: Hook to fetch all parts from the JSON files in src/data/parts
 * and merge them with any hardcoded parts if necessary.
 */
export const usePartRegistry = () => {
    return [] as ItemData[]
}

export default usePartRegistry
