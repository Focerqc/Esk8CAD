import { type PageProps } from "gatsby"
import React, { useState, useEffect } from "react"
import { Container } from "react-bootstrap"
import SiteNavbar from "../../components/SiteNavbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import PartTypesLinks from "../../components/PartTypesLinks"
import windowIsDefined from "../../hooks/windowIsDefined"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [hasPlatformParam, setHasPlatformParam] = useState(true);

    useEffect(() => {
        if (!windowIsDefined()) return;

        const params = new URLSearchParams(window.location.search);
        let param = params.get("brand") || params.get("platform");

        if (!param) {
            setHasPlatformParam(false);
            return;
        }

        let platformName = param;

        // Restore styling if it's an encoded slug from the relational update links
        if (param === param.toLowerCase() && !param.includes(" ")) {
            if (param === "meepo") platformName = "Meepo";
            else if (param === "newbee") platformName = "Newbee";
            else if (param === "acedeck") platformName = "Acedeck";
            else if (param === "3dservisas") platformName = "3D Servisas";
            else {
                // Capitalize standard generic words that were URL safe
                platformName = param.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
        }

        setActivePlatform(platformName);
    }, []);

    if (!hasPlatformParam) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
                <SiteMetaData title="Parts Catalog | ESK8CAD.COM" />
                <SiteNavbar isHomepage={false} />
                <main className="flex-grow-1">
                    <Container className="my-5">
                        <h1 className="flex-center mb-5 text-light fw-bold" style={{ textTransform: "uppercase", letterSpacing: "0.1rem" }}>Select a Brand</h1>
                        <p className="text-center text-muted mb-5 opacity-75">Browse aftermarket and open source parts by manufacturer</p>
                        <PartTypesLinks />
                    </Container>
                </main>
                <SiteFooter />
            </div>
        );
    }

    if (!activePlatform) {
        return null; // Await client hook
    }

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title={`${activePlatform} Parts | ESK8CAD.COM`} />
            <header>
                <SiteNavbar />
                <h1 className="flex-center">{activePlatform} Parts</h1>
            </header>

            <main className="page-items flex-grow-1">
                <Container>
                    <ItemListSearchbar platformOverride={activePlatform} />
                </Container>
            </main>
            <SiteFooter />
        </div>
    )
}

export default Page
