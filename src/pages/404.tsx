import { Link, PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"

const NotFoundPage: React.FC<PageProps> = () => {
    return (
        <>

            <SiteMetaData title="404 | ESK8CAD.COM" /><header>
                <SiteNavbar />

                <h1 className="flex-center">
                    404
                </h1>

                <p className="tagline flex-center">That page doesn't exist</p>
            </header>

            <main>
                <Container>
                    <div className="flex-center">
                        <p><Link to="/">ᐊ Home</Link>.</p>
                    </div>
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default NotFoundPage
