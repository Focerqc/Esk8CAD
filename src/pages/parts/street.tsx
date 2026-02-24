import { type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import ItemListSearchbar from "../../components/ItemListSearchbar"

import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            <SiteMetaData
                title="Street DIY Parts | ESK8CAD.COM"
                description="Open source or otherwise aftermarket parts for generic Street DIY platforms"
            />

            <header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Street DIY Parts
                </h1>
            </header>

            <main className="page-items">
                <Container>
                    <ItemListSearchbar />
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default Page
