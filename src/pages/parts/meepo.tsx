import { type PageProps } from "gatsby"
import React, { useEffect, useState, useMemo } from "react"
import { Container, Row, Col, Badge, Button, Alert, Spinner, Card } from "react-bootstrap"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import PartCard, { PartSchema } from "../../components/PartCard"
import { getSupabaseClient } from "../../utils/supabaseClient"
import "../../scss/pages/items.scss"

interface BoardPlatform {
    id: number;
    name: string;
    brand: string;
}

interface PartWithPlatform {
    id: string | number;
    title: string;
    image_src: string;
    type_of_part?: string[];
    fabrication_method?: string[];
    external_url?: string;
    dropbox_url?: string;
    platform_id: number;
    board_platforms?: BoardPlatform;
    platform?: string[];
}

const mapPartToSchema = (part: PartWithPlatform): PartSchema => {
    return {
        id: part.id ? String(part.id) : "Unknown",
        title: part.title || "Untitled Part",
        image_url: part.image_src || "",
        author: "Unknown User",
        boardPlatform: part.board_platforms?.name || (part.platform && part.platform.length > 0 ? part.platform[0] : "Meepo"),
        tags: [...(part.type_of_part || []), ...(part.fabrication_method || [])],
        externalUrl: part.external_url || undefined,
        dropboxUrl: part.dropbox_url || undefined,
    }
}

const Page: React.FC<PageProps> = () => {
    const [platforms, setPlatforms] = useState<BoardPlatform[]>([])
    const [platformsLoading, setPlatformsLoading] = useState(true)
    const [platformsError, setPlatformsError] = useState<string | null>(null)

    const [parts, setParts] = useState<PartWithPlatform[]>([])
    const [partsLoading, setPartsLoading] = useState(true)
    const [partsError, setPartsError] = useState<string | null>(null)

    const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null)

    useEffect(() => {
        const fetchMeepoData = async () => {
            const client = getSupabaseClient();

            if (!client) {
                const errMsg = "Database client unavailable - SSR or missing env.";
                setPlatformsError(errMsg);
                setPartsError(errMsg);
                setPlatformsLoading(false);
                setPartsLoading(false);
                return;
            }

            // Fetch platforms where brand matches 'meepo'
            try {
                const { data: pData, error: pError } = await client
                    .from('board_platforms')
                    .select('*')
                    .ilike('brand', '%meepo%')
                    .order('name');

                if (pError) throw pError;
                setPlatforms(pData || []);
            } catch (err: any) {
                console.error("Platforms fetch error:", err);
                setPlatformsError(err.message || "Failed to load board models - Retrying recommended.");
            } finally {
                setPlatformsLoading(false);
            }

            // Fetch parts with an inner join to board_platforms for matching brand
            try {
                const { data: partsData, error: partsError } = await client
                    .from('parts')
                    .select('*, board_platforms!inner(*)')
                    .ilike('board_platforms.brand', '%meepo%');

                if (partsError) throw partsError;
                setParts(partsData || []);
            } catch (err: any) {
                console.error("Parts fetch error:", err);
                setPartsError(err.message || "Failed to load parts data - Database connection timed out?");
            } finally {
                setPartsLoading(false);
            }
        };

        fetchMeepoData();
    }, []);

    // Filter displayed parts based on selected platform button
    const displayedParts = useMemo(() => {
        if (selectedPlatformId === null) return parts;
        return parts.filter(p => p.platform_id === selectedPlatformId || p.board_platforms?.id === selectedPlatformId);
    }, [parts, selectedPlatformId]);

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
                            <p className="lead text-muted opacity-75 mb-4" style={{ maxWidth: "600px" }}>
                                Open source or otherwise aftermarket parts compatible with the Meepo platform.
                                Select a specific board model below to filter available components.
                            </p>

                            {/* Relational Board Model Filters */}
                            <div className="mt-4">
                                <h5 className="text-uppercase text-secondary mb-3 fs-6 fw-bold spacing-1">Filter by Model</h5>
                                {platformsLoading ? (
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <Spinner animation="border" size="sm" />
                                        <span>Loading models...</span>
                                    </div>
                                ) : platformsError ? (
                                    <Alert variant="danger" className="py-2 px-3 d-inline-block shadow-sm">
                                        <strong>Database Error:</strong> {platformsError}
                                    </Alert>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2 justify-content-start">
                                        <Button
                                            variant={selectedPlatformId === null ? "info" : "outline-info"}
                                            className="fw-bold rounded-pill px-4 text-uppercase"
                                            onClick={() => setSelectedPlatformId(null)}
                                        >
                                            All Models
                                        </Button>
                                        {platforms.map(platform => (
                                            <Button
                                                key={`platform-filter-${platform.id}`}
                                                variant={selectedPlatformId === platform.id ? "info" : "outline-secondary"}
                                                className="fw-bold rounded-pill px-4"
                                                onClick={() => setSelectedPlatformId(platform.id)}
                                            >
                                                {platform.name}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Right Column: Empty placeholder for future search/filter migration or metadata */}
                        <Col xs={12} md={4} className="d-none d-md-block text-end">
                            {/* Layout Anchor - Kept explicitly blank/empty per requirements for left-heavy structure */}
                        </Col>
                    </Row>

                    {/* Below Header: The Parts Results Grid */}
                    <div className="parts-grid-container min-h-300">
                        {partsLoading ? (
                            <Row className="my-5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4 d-flex align-items-stretch" style={{ minWidth: "280px" }} key={`skeleton-${i}`}>
                                        <Card className="h-100 shadow-sm border-secondary bg-dark w-100 position-relative" aria-hidden="true">
                                            <div className="placeholder-glow" style={{ aspectRatio: "16 / 9", height: "auto", width: "100%" }}>
                                                <div className="placeholder w-100 h-100 bg-secondary" style={{ opacity: 0.2 }}></div>
                                            </div>
                                            <Card.Body className="d-flex flex-column">
                                                <div className="placeholder-glow mb-2">
                                                    <span className="placeholder col-8 rounded bg-secondary"></span>
                                                </div>
                                                <div className="placeholder-glow mb-3">
                                                    <span className="placeholder col-5 rounded bg-secondary"></span>
                                                </div>
                                                <div className="placeholder-glow mb-4">
                                                    <span className="placeholder col-4 me-2 rounded bg-secondary"></span>
                                                    <span className="placeholder col-3 rounded bg-secondary"></span>
                                                </div>
                                                <div className="mt-auto pt-3 border-top border-secondary placeholder-glow">
                                                    <span className="placeholder col-12 btn btn-outline-info disabled" style={{ height: '31px' }}></span>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : partsError ? (
                            <Alert variant="danger" className="my-4 shadow-sm">
                                <strong>Error loading parts:</strong> {partsError}
                                {partsError.includes("Failed to fetch") && (
                                    <div className="mt-2 text-muted small">
                                        <em>Diagnostics: This network error typically means the database URL is missing or improperly formatted. Check browser environment variables.</em>
                                    </div>
                                )}
                            </Alert>
                        ) : displayedParts.length === 0 ? (
                            <Alert variant="info" className="my-5 py-5 text-center border-0 shadow-sm" style={{ backgroundColor: "#1a1d20", minHeight: "200px" }}>
                                <h4 className="fw-bold mb-2 text-info">No parts found</h4>
                                <p className="mb-0 text-light opacity-75">There are currently no parts available for this selection.</p>
                                {selectedPlatformId !== null && (
                                    <Button variant="outline-info" size="sm" className="mt-3 rounded-pill px-4" onClick={() => setSelectedPlatformId(null)}>
                                        View All Meepo Parts
                                    </Button>
                                )}
                            </Alert>
                        ) : (
                            <Row>
                                {displayedParts.map((part, index) => (
                                    <PartCard key={`part-card-${part.id}-${index}`} part={mapPartToSchema(part)} index={index} />
                                ))}
                            </Row>
                        )}
                    </div>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
                .border-secondary { border-color: #24282d !important; }
                .spacing-1 { letter-spacing: 0.05rem; }
                .min-h-300 { min-height: 300px; }
            `}} />
        </div>
    )
}

export default Page
