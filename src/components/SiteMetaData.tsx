import React, { useEffect } from "react"
import useMetaData from "../hooks/useMetaData"
import "../scss/styles.scss"

type MetaDataProps = {
    title?: string
    description?: string
    image?: string
}

const SiteMetaData = ({ title, description, image }: MetaDataProps) => {
    const { title: defaultTitle, description: defaultDescription, image: defaultImage, siteUrl } = useMetaData()

    const finalTitle = title || defaultTitle;
    const finalDescription = description || defaultDescription;

    useEffect(() => {
        document.title = finalTitle;
    }, [finalTitle]);

    return (
        <React.Fragment>
            {/* Note: In Vite/React, we can't just return <title> in a component and expect it to move to head without something like Helmet. */}
            {/* But we can still provide the meta tags here which some systems expect. */}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:image" content={image || siteUrl + defaultImage} />
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content="esk8, cad, electric skateboard, diy, 3d print, open source, aftermarket" />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content="en_US" />
            <link rel="manifest" href="/manifest.webmanifest" />
        </React.Fragment>
    )
}

export default SiteMetaData;
