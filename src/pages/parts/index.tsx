import { type PageProps } from "gatsby"
import React, { useState, useEffect } from "react"
import { Container, Row, Col, Badge } from "react-bootstrap"
import PartTypesLinks from "../../components/PartTypesLinks"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import windowIsDefined from "../../hooks/windowIsDefined"
import "../../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    const [platformQuery, setPlatformQuery] = useState<string | null>(null);

    useEffect(() => {
        if (windowIsDefined()) {
            const params = new URLSearchParams(window.location.search);
            const plat = params.get("platform");
            if (plat) setPlatformQuery(plat);
        }
    }, []);

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title={platformQuery ? `${platformQuery} Parts | ESK8CAD.COM` : "Parts | ESK8CAD.COM"} />
            <SiteNavbar isHomepage={false} />

            <main className="flex-grow-1">
                <Container className="my-5">
                    {platformQuery ? (
                        <>
                            {/* Top Split Header: Info on Left / Empty on Right */}
                            <Row className="mb-5 border-bottom border-secondary pb-4 align-items-center">
                                <Col xs={12} md={8} className="text-start">
                                    <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                                        <h1 className="display-4 fw-bold uppercase letter-spacing-1 mb-0 text-white">
                                            {platformQuery} <span style={{ color: '#0dcaf0' }}>Parts</span>
                                        </h1>
                                        <Badge bg="primary" className="fw-bold px-3 py-2 text-uppercase fs-6">OEM & Aftermarket</Badge>
                                    </div>
                                    <p className="lead text-muted opacity-75 mb-0" style={{ maxWidth: "600px" }}>
                                        Open source or otherwise aftermarket parts compatible with the {platformQuery} platform.
                                        Find exact fitment, download .STEP/.STL models, and review fabrication details below.
                                    </p>
                                </Col>

                                {/* Right Column: Empty placeholder for future search/filter migration or metadata */}
                                <Col xs={12} md={4} className="d-none d-md-block text-end">
                                    {/* Layout Anchor - Kept explicitly blank/empty per requirements for future migration */}
                                </Col>
                            </Row>

                            {/* Below Header: The Search bar and "Parts" results grid */}
                            <ItemListSearchbar platformOverride={platformQuery} />
                        </>
                    ) : (
                        <>
                            <h1 className="flex-center mb-5 uppercase text-light letter-spacing-1">Board Platforms</h1>
                            <p className="text-center text-muted mb-4 opacity-75">What board type are you looking for?</p>
                            <PartTypesLinks />
                        </>
                    )}
                </Container>
            </main>

            <SiteFooter />
            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
            `}} />
        </div>
    )
}

export default Page
