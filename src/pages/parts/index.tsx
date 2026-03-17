import React, { useState, useEffect } from "react"
import { Container } from "react-bootstrap"
import SiteNavbar from "../../components/SiteNavbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import PartTypesLinks from "../../components/PartTypesLinks"
import windowIsDefined from "../../hooks/windowIsDefined"
import { useParams } from "react-router-dom"
import "../../scss/pages/items.scss"

const Page: React.FC<any> = () => {
    const { brand: routeBrand, category: routeCategory } = useParams();
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [hasPlatformParam, setHasPlatformParam] = useState(true);

    useEffect(() => {
        if (!windowIsDefined()) return;

        const params = new URLSearchParams(window.location.search);
        let brandParam = routeBrand || params.get("brand") || params.get("platform");
        let activeCategory = routeCategory || params.get("category") || params.get("tag");

        if (!brandParam && !activeCategory) {
            setHasPlatformParam(false);
            return;
        }

        let platformName = brandParam;

        setActivePlatform(platformName);
        setHasPlatformParam(true);
    }, [routeBrand, routeCategory]);

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

    const metaTitle = activePlatform ? `ESK8CAD/${activePlatform}` : (routeCategory ? `ESK8CAD/${routeCategory.charAt(0).toUpperCase() + routeCategory.slice(1)}` : "ESK8CAD Parts Catalog");
    const titleText = activePlatform ? `${activePlatform} Parts` : (routeCategory ? `${routeCategory.charAt(0).toUpperCase() + routeCategory.slice(1)}` : "Parts");

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title={metaTitle} />
            <header>
                <SiteNavbar />
                <h1 className="flex-center uppercase letter-spacing-2 mt-5 mb-0" style={{ fontWeight: 900 }}>{titleText}</h1>
            </header>

            <main className="page-items flex-grow-1">
                <Container>
                    <ItemListSearchbar platformOverride={activePlatform || undefined} />
                </Container>
            </main>
            <SiteFooter />
        </div>
    )
}

export default Page
