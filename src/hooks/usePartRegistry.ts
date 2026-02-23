import { graphql, useStaticQuery } from "gatsby"

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
    parent?: {
        relativePath: string;
    };
}

/**
 * usePartRegistry: Hook to fetch all parts from the JSON files in src/data/parts
 * and merge them with any hardcoded parts if necessary.
 */
export const usePartRegistry = () => {
    const data = useStaticQuery(graphql`
        query {
            allPartsJson {
                nodes {
                    title
                    imageSrc
                    platform
                    fabricationMethod
                    typeOfPart
                    dropboxUrl
                    dropboxZipLastUpdated
                    externalUrl
                    isOem
                    parent {
                        ... on File {
                            relativePath
                        }
                    }
                }
            }
        }
    `)

    return data.allPartsJson.nodes as ItemData[]
}

export default usePartRegistry
