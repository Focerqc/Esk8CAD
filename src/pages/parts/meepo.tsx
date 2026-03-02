import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row, Col, Badge } from "react-bootstrap"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData
                title="Meepo Parts | ESK8CAD.COM"
                description="Open source or otherwise aftermarket parts for the Meepo platform"
            />
            <SiteNavbar isHomepage={false} />

            <main className="flex-grow-1">
                <Container className="my-5">
                    {/* Top Split Header: Info on Left / Empty on Right */}
                    <Row className="mb-5 border-bottom border-secondary pb-4 align-items-center">
                        <Col xs={12} md={8} className="text-start">
                            <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                                <h1 className="display-4 fw-bold uppercase letter-spacing-1 mb-0 text-white">
                                    Meepo <span style={{ color: '#0dcaf0' }}>Parts</span>
                                </h1>
                                <Badge bg="primary" className="fw-bold px-3 py-2 text-uppercase fs-6">OEM & Aftermarket</Badge>
                            </div>
                            <p className="lead text-muted opacity-75 mb-0" style={{ maxWidth: "600px" }}>
                                Open source or otherwise aftermarket parts compatible with the Meepo platform.
                                Find exact fitment, download .STEP/.STL models, and review fabrication details below.
                            </p>
                        </Col>

                        {/* Right Column: Empty placeholder for future search/filter migration or metadata */}
                        <Col xs={12} md={4} className="d-none d-md-block text-end">
                            {/* Layout Anchor - Kept explicitly blank/empty per requirements for future migration */}
                        </Col>
                    </Row>

                    {/* Below Header: The Search bar and "Parts" results grid */}
                    {/* ItemListSearchbar handles the Supabase query via useParts hook + provides defensive loading/error states natively. */}
                    <ItemListSearchbar platformOverride="Meepo" />

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

export default Page
