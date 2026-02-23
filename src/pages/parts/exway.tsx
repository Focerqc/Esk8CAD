import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row } from "react-bootstrap"
import CopyrightCard from "../../components/CopyrightCard"
import ItemCard from "../../components/ItemCard"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"
import { exwayParts } from "../../util/parts"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData
            title="Exway Parts | ESK8CAD.COM"
            description="Open source or otherwise aftermarket parts for the Exway platform" /><header>
                <SiteNavbar />

                <h1 className="flex-center">
                    Exway Parts
                </h1>
            </header>

            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={exwayParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!exwayParts.length && exwayParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default Page
