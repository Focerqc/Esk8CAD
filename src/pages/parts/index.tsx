import { type PageProps } from "gatsby"
import React, { useState, useEffect } from "react"
import { Container } from "react-bootstrap"
import PartTypesLinks from "../../components/PartTypesLinks"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import windowIsDefined from "../../hooks/windowIsDefined"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    const [platformQuery, setPlatformQuery] = useState<string | null>(null);

    useEffect(() => {
        if (windowIsDefined()) {
            const params = new URLSearchParams(window.location.search);
            const plat = params.get("platform");
            if (plat) setPlatformQuery(plat);
        }
    }, []);

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title={platformQuery ? `${platformQuery} Parts | ESK8CAD.COM` : "Parts | ESK8CAD.COM"} />
            <SiteNavbar isHomepage={false} />

            <main className="flex-grow-1">
                <Container className="my-5">
                    {platformQuery ? (
                        <>
                            <h1 className="flex-center mb-5 uppercase text-light letter-spacing-1">{platformQuery} Parts</h1>
                            <ItemListSearchbar platformOverride={platformQuery} />
                        </>
                    ) : (
                        <>
                            <h1 className="flex-center mb-5 uppercase text-light letter-spacing-1">Board Platforms</h1>
                            <p className="text-center text-muted mb-4 opacity-75">What board type are you looking for?</p>
                            <PartTypesLinks />
                        </>
                    )}
                </Container>
            </main>

            <SiteFooter />
            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
            `}} />
        </div>
    )
}

export default Page
