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
import { idlerParts } from "../../../util/parts"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData
            title="Idler Parts | ESK8CAD.COM"
            description="Open source Idler components for electric skateboards" /><header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Idler Parts
                </h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={idlerParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!idlerParts.length && idlerParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}

export default Page
