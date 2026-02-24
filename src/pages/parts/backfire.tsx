import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row } from "react-bootstrap"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import CopyrightCard from "../../components/CopyrightCard"


import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"


const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData
            title="Backfire Parts | ESK8CAD.COM"
            description="Open source or otherwise aftermarket parts for the Backfire platform" /><header>
                <SiteNavbar />

                <h1 className="flex-center">
                    Backfire Parts
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
