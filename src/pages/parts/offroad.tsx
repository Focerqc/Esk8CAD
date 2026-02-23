import { type PageProps } from "gatsby"
import React, { useMemo } from "react"
import { Container, Row } from "react-bootstrap"
import CopyrightCard from "../../components/CopyrightCard"
import ItemCard from "../../components/ItemCard"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"
import { offRoadParts } from "../../util/parts"
import usePartRegistry from "../../hooks/usePartRegistry"

const Page: React.FC<PageProps> = () => {
    const registryParts = usePartRegistry();

    const combinedParts = useMemo(() => {
        const platformRegistry = registryParts.filter(p =>
            p.platform && p.platform.includes("Off-Road (DIY/Generic)")
        );
        return [...offRoadParts, ...platformRegistry].sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    }, [registryParts]);

    return (
        <>
            <SiteMetaData
                title="Off-Road DIY Parts | ESK8CAD.COM"
                description="Open source or otherwise aftermarket parts for generic Off-Road DIY platforms"
            />

            <header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Off-Road DIY Parts
                </h1>
            </header>

            <main className="page-items">
                <Container>
                    {/* Search area */}
                    <ItemListSearchbar partList={combinedParts} />

                    {/* Search results headers */}
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>

                    <Row>
                        {/* List parts */}
                        {combinedParts.length > 0 ? (
                            combinedParts.map(ItemCard)
                        ) : (
                            <div className="text-center py-5">
                                <p className="opacity-50">No parts found matching this platform.</p>
                            </div>
                        )}

                        {/* Copyright card */}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default Page
