import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row } from "react-bootstrap"
import CopyrightCard from "../../../components/CopyrightCard"
import ItemCard from "../../../components/ItemCard"
import ItemListSearchbar from "../../../components/ItemListSearchbar"
import SiteFooter from "../../../components/SiteFooter"
import SiteMetaData from "../../../components/SiteMetaData"
import SiteNavbar from "../../../components/SiteNavbar"
import "../../../scss/pages/items.scss"
import { sprocketParts } from "../../../util/parts"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData
            title="Sprocket Parts | ESK8CAD.COM"
            description="Open source Sprocket components for electric skateboards" /><header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Sprocket Parts
                </h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={sprocketParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!sprocketParts.length && sprocketParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}

export default Page
