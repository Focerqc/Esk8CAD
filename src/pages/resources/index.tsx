import { type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import ResourceTypesLinks from "../../components/ResourceTypesLinks"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData title="Resources | ESK8CAD.COM" /><header>
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
                    <p>What would you like to find?</p>

                    <ResourceTypesLinks />
                </Container>
            </main>
                
            <SiteFooter />
        </>
    )
}

export default Page
