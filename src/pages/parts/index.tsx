import { type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import PartTypesLinks from "../../components/PartTypesLinks"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData title="Parts | ESK8CAD.COM" /><header>
                <SiteNavbar isHomepage={true} />

                <h1 className="flex-center">
                    ESK8CAD.COM
                </h1>

                <p className="tagline flex-center">
                    <br />
                </p>
            </header>

            <main>
                <Container>
                    <p>What board type are you looking for?</p>

                    <PartTypesLinks />
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default Page
