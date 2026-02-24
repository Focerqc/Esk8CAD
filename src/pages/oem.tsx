import { type PageProps } from "gatsby"
import React from "react"
import { Container, Button } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"

const OemPage: React.FC<PageProps> = () => {
    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <SiteMetaData
                title="OEM Parts | ESK8CAD.COM"
                description="Verified OEM replacement parts for electric skateboards."
            />
            <SiteNavbar />

            <header className="py-5 text-center border-bottom border-secondary mb-4">
                <Container>
                    <h1 className="display-4 fw-bold text-success mb-2 uppercase letter-spacing-1">OEM Certified Parts</h1>
                    <p className="opacity-75 lead" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Verified replacement components from original manufacturers.
                    </p>
                </Container>
            </header>

            <main className="flex-grow-1">
                <Container>
                    <div className="alert alert-info mt-4">
                        This category is migrating to the new database. Please use the main search to find these parts.
                    </div>

                    <div className="text-center py-5">
                        <Button variant="success" size="lg" href="/submit">Submit OEM Part</Button>
                    </div>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
                .border-secondary { border-color: #24282d !important; }
            `}} />
        </div>
    )
}

export default OemPage
