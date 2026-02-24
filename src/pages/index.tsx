import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row, Col, Button } from "react-bootstrap"
import TechnicalTagsLinks from "../components/TechnicalTagsLinks"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"

const platformsRaw = [
    { label: "Street (DIY/Generic)", href: "/parts/street" },
    { label: "Off-Road (DIY/Generic)", href: "/parts/offroad" },
    { label: "Misc", href: "/parts/misc" },
    { label: "3D Servisas", href: "/parts/3dservisas" },
    { label: "Acedeck", href: "/parts/acedeck" },
    { label: "Apex Boards", href: "/parts/apex" },
    { label: "Backfire", href: "/parts/backfire" },
    { label: "Bioboards", href: "/parts/bioboards" },
    { label: "Boardnamics", href: "/parts/boardnamics" },
    { label: "Defiant Board Society", href: "/parts/defiant" },
    { label: "Evolve", href: "/parts/evolve" },
    { label: "Exway", href: "/parts/exway" },
    { label: "Fluxmotion", href: "/parts/fluxmotion" },
    { label: "Hoyt St", href: "/parts/hoyt" },
    { label: "Lacroix Boards", href: "/parts/lacroix" },
    { label: "Linnpower", href: "/parts/linnpower" },
    { label: "MBoards", href: "/parts/mboards" },
    { label: "MBS", href: "/parts/mbs" },
    { label: "Meepo", href: "/parts/meepo" },
    { label: "Newbee", href: "/parts/newbee" },
    { label: "Propel", href: "/parts/propel" },
    { label: "Radium Performance", href: "/parts/radium" },
    { label: "Stooge Raceboards", href: "/parts/stooge" },
    { label: "Summerboard", href: "/parts/summerboard" },
    { label: "Trampa Boards", href: "/parts/trampa" },
    { label: "Wowgo", href: "/parts/wowgo" }
];

const Page: React.FC<PageProps> = () => {
    // Platform separation logic
    const pinnedStreet = platformsRaw.find(p => p.label === "Street (DIY/Generic)");
    const pinnedOffroad = platformsRaw.find(p => p.label === "Off-Road (DIY/Generic)");
    const pinnedMisc = platformsRaw.find(p => p.label === "Misc");

    const others = platformsRaw
        .filter(p => !["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc"].includes(p.label))
        .sort((a, b) => a.label.localeCompare(b.label));

    const group1 = others.filter(p => { const first = p.label[0].toUpperCase(); return first >= '0' && first <= 'I'; });
    const group2 = others.filter(p => { const first = p.label[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
    const group3 = others.filter(p => { const first = p.label[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

    return (
        <div className="bg-black text-light min-vh-100 pb-5">
            <SiteMetaData title="Home | ESK8CAD.COM" />
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
                                    {pinnedStreet && (
                                        <Button variant="info" href={pinnedStreet.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedStreet.label}
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={12} lg={4}>
                                    {pinnedOffroad && (
                                        <Button variant="info" href={pinnedOffroad.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedOffroad.label}
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={12} lg={4}>
                                    {pinnedMisc && (
                                        <Button variant="info" href={pinnedMisc.href} className="w-100 fw-bold py-3 shadow-sm uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center">
                                            {pinnedMisc.label}
                                        </Button>
                                    )}
                                </Col>
                            </Row>

                            <h3 className="h6 fw-bold text-muted mb-4 uppercase letter-spacing-1 border-bottom border-secondary pb-2 text-center">Brands</h3>

                            <Row className="g-4 mb-4">
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">A - I</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group1.map(p => (
                                            <Button key={p.href} variant="outline-info" href={p.href} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>
                                                {p.label}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">J - R</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group2.map(p => (
                                            <Button key={p.href} variant="outline-info" href={p.href} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>
                                                {p.label}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                    <div className="text-center mb-1">
                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">S - Z</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {group3.map(p => (
                                            <Button key={p.href} variant="outline-info" href={p.href} className="flex-fill fw-bold text-wrap lh-sm text-center" style={{ minWidth: "46%" }}>
                                                {p.label}
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