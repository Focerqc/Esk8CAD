import { type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import CopyrightCard from "../../components/CopyrightCard"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    return (
        <>

            <SiteMetaData
                title="Acedeck Parts | ESK8CAD.COM"
                description="Open source or otherwise aftermarket parts for the Acedeck platform" /><header>
                <SiteNavbar />
                <h1 className="flex-center">Acedeck Parts</h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar />
                    <div className="d-flex justify-content-center mt-5">
                        <CopyrightCard />
                    </div>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}
export default Page
