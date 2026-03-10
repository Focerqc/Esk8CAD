import React from "react"
import { Container, Row, Col, Button } from "react-bootstrap"
import TechnicalTagsLinks from "../components/TechnicalTagsLinks"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"
import { getSupabaseClient, Brand } from "../lib/supabase"
import { useState, useEffect } from "react"

import { useBoardHook } from "../hooks/useBoardHook"

const Page: React.FC = () => {
    const { special, groupedBrands, loading } = useBoardHook();

    const getPlatformHref = (brand: Brand) => {
        return `/parts?brand=${encodeURIComponent(brand.name)}`;
    };

    const pinnedStreet = special.find(p => p.name === "Street (DIY/Generic)");
    const pinnedStreetData = pinnedStreet ? { label: pinnedStreet.name, href: getPlatformHref(pinnedStreet) } : null;

    const pinnedOffroad = special.find(p => p.name === "Off-Road (DIY/Generic)");
    const pinnedOffroadData = pinnedOffroad ? { label: pinnedOffroad.name, href: getPlatformHref(pinnedOffroad) } : null;

    const pinnedMisc = special.find(p => p.name === "Misc");
    const pinnedMiscData = pinnedMisc ? { label: pinnedMisc.name, href: getPlatformHref(pinnedMisc) } : null;

    const group1 = groupedBrands.group1;
    const group2 = groupedBrands.group2;
    const group3 = groupedBrands.group3;

    return (
        <div className="bg-black text-light min-vh-100 pb-5">
            <SiteMetaData title="ESK8CAD/Home" />
            <header>
                <SiteNavbar isHomepage={true} />
                <div className="py-5 text-center">
                    <h1 className="display-3 fw-bold mb-0" style={{ letterSpacing: '-0.02em' }}>ESK8CAD.COM</h1>
                    <p className="mt-2 text-info small uppercase letter-spacing-2 fw-bold opacity-75">Super epic ESK8 Parts Library</p>
                </div>
            </header>

            <main>
                <Container>
                    <div className="mb-5 lead opacity-75 text-center mx-auto" style={{ maxWidth: '800px' }}>
                        <p>A curated collection of OEM and DIY ESK8 CAD files — .STEP and .STL formats.</p>
                        <p className="small">Onewheel parts? Visit <a href="https://PubParts.xyz" className="text-info text-decoration-none fw-bold">PubParts.xyz</a></p>
                    </div>

                    {/* SECTION: BOARD PLATFORMS */}
                    <div className="mb-5">
                        <h2 className="h4 fw-bold uppercase letter-spacing-1 mb-4 border-bottom border-secondary pb-2" style={{ color: '#0dcaf0' }}>Board Platforms</h2>
                        <ClientOnly fallback={<div className="py-4 text-center opacity-25">Loading...</div>}>
                            <Row className="g-3 mb-5">
                                <Col xs={12} lg={4}>
                                    {pinnedStreetData && (
                                        <Button variant="info" href={pinnedStreetData.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedStreetData.label}
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={12} lg={4}>
                                    {pinnedOffroadData && (
                                        <Button variant="info" href={pinnedOffroadData.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedOffroadData.label}
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={12} lg={4}>
                                    {pinnedMiscData && (
                                        <Button variant="info" href={pinnedMiscData.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedMiscData.label}
                                        </Button>
                                    )}
                                </Col>
                            </Row>

                            <h3 className="h6 fw-bold text-light mb-4 uppercase letter-spacing-1 border-bottom border-secondary pb-2 text-center">Brands</h3>

                            <Row className="g-4 mb-4">
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-light uppercase letter-spacing-1">0-9 / A - I</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group1.map(b => (
                                            <Button key={b.id} variant="outline-info" href={getPlatformHref(b)} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>

                                                {b.name}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-light uppercase letter-spacing-1">J - R</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group2.map(b => (
                                            <Button key={b.id} variant="outline-info" href={getPlatformHref(b)} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>

                                                {b.name}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-light uppercase letter-spacing-1">S - Z</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group3.map(b => (
                                            <Button key={b.id} variant="outline-info" href={getPlatformHref(b)} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>
                                                {b.name}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </ClientOnly>
                    </div>

                    {/* SECTION: PART CATEGORIES */}
                    <div className="mb-5">
                        <h2 className="h4 fw-bold uppercase letter-spacing-1 mb-4 border-bottom border-secondary pb-2" style={{ color: '#198754' }}>Part Categories</h2>
                        <ClientOnly fallback={<div className="py-4 text-center opacity-25">Loading...</div>}>
                            <TechnicalTagsLinks />
                        </ClientOnly>
                    </div>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .letter-spacing-1 { letter-spacing: 0.15rem; }
                .letter-spacing-2 { letter-spacing: 0.3rem; }
                .uppercase { text-transform: uppercase; }
            `}} />
        </div>
    )
}

export default Page