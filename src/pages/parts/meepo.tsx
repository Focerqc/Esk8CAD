import { type PageProps } from "gatsby"
import React, { useEffect, useState, useMemo } from "react"
import { Container, Row, Col, Button, Alert, Card } from "react-bootstrap"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import PartCard, { PartSchema } from "../../components/PartCard"
import { getSupabaseClient } from "../../utils/supabaseClient"
import "../../scss/pages/items.scss"

// Types
interface Model {
    id: number;
    name: string;
    brand_id: number;
}

interface Category {
    id: number;
    name: string;
}

interface PartWithPlatform {
    id: string | number;
    title: string;
    image_src: string;
    type_of_part?: string[]; // Legacy
    fabrication_method?: string[]; // Legacy
    external_url?: string;
    dropbox_url?: string;
    platform?: string[]; // Legacy
    author?: string; // Legacy

    // Relational Additions (Read-Only)
    model_id?: number | null;
    category_id?: number | null;
    models?: Model;
    categories?: Category;
}

// Map the relational payload cleanly into the schema expected by the legacy PartCard
const mapPartToSchema = (part: PartWithPlatform): PartSchema => {
    const tags = new Set<string>();
    if (part.categories?.name) tags.add(part.categories.name);
    if (part.type_of_part) part.type_of_part.forEach(t => tags.add(t));
    if (part.fabrication_method) part.fabrication_method.forEach(t => tags.add(t));

    return {
        id: part.id ? String(part.id) : "Unknown",
        title: part.title || "Untitled Part",
        image_url: part.image_src || "",
        author: part.author || "Unknown User",
        boardPlatform: part.models?.name || (part.platform && part.platform.length > 0 ? part.platform[0] : "Meepo"),
        tags: Array.from(tags),
        externalUrl: part.external_url || undefined,
        dropboxUrl: part.dropbox_url || undefined,
    }
}

const Page: React.FC<PageProps> = () => {
    // Data State
    const [models, setModels] = useState<Model[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [parts, setParts] = useState<PartWithPlatform[]>([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

    useEffect(() => {
        let isMounted = true;

        const fetchRelationalData = async () => {
            const client = getSupabaseClient();

            if (!client) {
                if (isMounted) {
                    setError("Database client unavailable - SSR or missing env.");
                    setLoading(false);
                }
                return;
            }

            try {
                // 1) Find the specific brand_id for "Meepo"
                const { data: brandData, error: brandError } = await client
                    .from('brands')
                    .select('id')
                    .ilike('name', 'meepo')
                    .maybeSingle();

                if (brandError) throw brandError;

                const meepoBrandId = brandData?.id;

                if (!meepoBrandId) {
                    throw new Error("Brand 'meepo' not found in the relational DB.");
                }

                // 2) Fetch Models assigned to Meepo
                const { data: modelsData, error: modelsError } = await client
                    .from('models')
                    .select('*')
                    .eq('brand_id', meepoBrandId)
                    .order('name');

                if (modelsError) throw modelsError;
                if (isMounted) setModels(modelsData || []);

                // 3) Fetch Global Categories
                const { data: catsData, error: catsError } = await client
                    .from('categories')
                    .select('*')
                    .order('name');

                if (catsError) throw catsError;
                if (isMounted) setCategories(catsData || []);

                // 4) Fetch Parts configured via INNER join to Models (filtered for Meepo model items)
                const { data: partsData, error: partsError } = await client
                    .from('parts')
                    .select('*, models!inner(*), categories(*)')
                    .eq('models.brand_id', meepoBrandId);

                if (partsError) throw partsError;
                if (isMounted) setParts(partsData || []);

            } catch (err: any) {
                console.error("Relational query error:", err);
                if (isMounted) setError(err.message || "Failed to load relational dashboard.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRelationalData();

        return () => { isMounted = false; };
    }, []);

    // Filter parts logic based on the user clicking Model and/or Category buttons
    const displayedParts = useMemo(() => {
        return parts.filter(p => {
            const matchModel = selectedModelId === null || p.models?.id === selectedModelId || p.model_id === selectedModelId;
            const matchCategory = selectedCategoryId === null || p.categories?.id === selectedCategoryId || p.category_id === selectedCategoryId;
            return matchModel && matchCategory;
        });
    }, [parts, selectedModelId, selectedCategoryId]);

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title="Meepo Parts | ESK8CAD.COM" description="Open source aftermarket parts for the Meepo platform" />
            <SiteNavbar isHomepage={false} />

            <main className="flex-grow-1">
                <Container className="my-5">

                    {/* TOP HEADER ROW - Strict 9-Column Left / 3-Column Right Split */}
                    <Row className="mb-5 border-bottom border-secondary pb-4">
                        <Col xs={12} md={9} className="text-start">

                            {/* Brand Header & Un-Squished Description */}
                            <h2 className="display-4 fw-bold uppercase letter-spacing-1 mb-2 text-white">
                                MEEPO <span style={{ color: '#0dcaf0' }}>PARTS</span>
                            </h2>
                            <p className="lead text-muted opacity-75 mb-4 w-100">
                                Open source or otherwise aftermarket parts compatible with the Meepo platform.
                                Select a specific board model or category below to filter available components.
                            </p>

                            {/* Relational Button Groups with Skeleton Defense */}
                            {loading ? (
                                <div className="placeholder-glow w-100 my-4" style={{ minHeight: "150px" }}>
                                    <h6 className="text-uppercase text-secondary fw-bold mb-2">Models</h6>
                                    <div className="mb-3 d-flex gap-2">
                                        <span className="placeholder col-2 rounded-pill py-3"></span>
                                        <span className="placeholder col-3 rounded-pill py-3"></span>
                                        <span className="placeholder col-2 rounded-pill py-3"></span>
                                    </div>
                                    <h6 className="text-uppercase text-secondary fw-bold mb-2 mt-4">Categories</h6>
                                    <div className="d-flex gap-2">
                                        <span className="placeholder col-3 rounded-pill py-3"></span>
                                        <span className="placeholder col-2 rounded-pill py-3"></span>
                                        <span className="placeholder col-4 rounded-pill py-3"></span>
                                    </div>
                                </div>
                            ) : error ? (
                                <Alert variant="danger" className="py-2 px-3 shadow-sm d-inline-block">
                                    <strong>Database Error:</strong> {error}
                                </Alert>
                            ) : (
                                <div className="w-100 pe-md-4">
                                    {/* Models Selection */}
                                    <div className="mb-4">
                                        <h6 className="text-uppercase text-secondary fw-bold mb-2">Board Models</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                variant={selectedModelId === null ? "info" : "outline-info"}
                                                className="fw-bold rounded-pill px-4 btn-sm text-uppercase border-secondary"
                                                onClick={() => setSelectedModelId(null)}
                                            >
                                                All Models
                                            </Button>
                                            {models.map(m => (
                                                <Button
                                                    key={`model-${m.id}`}
                                                    variant={selectedModelId === m.id ? "info" : "outline-secondary"}
                                                    className="fw-bold rounded-pill px-4 btn-sm text-uppercase"
                                                    onClick={() => setSelectedModelId(m.id)}
                                                >
                                                    {m.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Categories Selection */}
                                    <div className="mb-3">
                                        <h6 className="text-uppercase text-secondary fw-bold mb-2">Categories</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                variant={selectedCategoryId === null ? "info" : "outline-info"}
                                                className="fw-bold rounded-pill px-4 btn-sm text-uppercase border-secondary"
                                                onClick={() => setSelectedCategoryId(null)}
                                            >
                                                All Categories
                                            </Button>
                                            {categories.map(c => (
                                                <Button
                                                    key={`cat-${c.id}`}
                                                    variant={selectedCategoryId === c.id ? "info" : "outline-secondary"}
                                                    className="fw-bold rounded-pill px-4 btn-sm border-secondary text-uppercase"
                                                    onClick={() => setSelectedCategoryId(c.id)}
                                                >
                                                    {c.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </Col>
                        {/* The Right Column is intentionally empty/placeholder to enforce the left-leaning visual weight */}
                        <Col xs={12} md={3} className="d-none d-md-block"></Col>
                    </Row>

                    {/* PARTS RENDERING GRID */}
                    <div className="parts-grid-container" style={{ minHeight: "400px" }}>
                        {loading ? (
                            <Row className="my-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4 d-flex align-items-stretch" style={{ minWidth: "280px" }} key={`skeleton-card-${i}`}>
                                        <Card className="h-100 shadow-sm border-secondary bg-dark w-100">
                                            <div className="placeholder-glow" style={{ aspectRatio: "16 / 9", width: "100%" }}>
                                                <div className="placeholder w-100 h-100 bg-secondary" style={{ opacity: 0.2 }}></div>
                                            </div>
                                            <Card.Body className="d-flex flex-column placeholder-glow">
                                                <span className="placeholder col-8 rounded bg-secondary mb-2"></span>
                                                <span className="placeholder col-5 rounded bg-secondary mb-3"></span>
                                                <span className="placeholder col-12 btn btn-outline-info disabled mt-auto"></span>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : error ? (
                            <Alert variant="danger" className="my-5 shadow-sm">
                                <strong>Runtime Alert:</strong> Parts data unresolvable.
                                {error.includes("Failed to fetch") && <div className="mt-2 text-muted small">Verify browser-side variable bindings.</div>}
                            </Alert>
                        ) : displayedParts.length === 0 ? (
                            <Alert variant="info" className="my-5 py-5 text-center border-0 shadow-sm" style={{ backgroundColor: "#1a1d20" }}>
                                <h4 className="fw-bold mb-2 text-info">No Matching Components</h4>
                                <p className="mb-0 text-light opacity-75">There are currently no models mapped to this specific combination of relational filters.</p>
                                {(selectedModelId !== null || selectedCategoryId !== null) && (
                                    <Button variant="outline-info" size="sm" className="mt-4 rounded-pill px-4 text-uppercase fw-bold" onClick={() => { setSelectedModelId(null); setSelectedCategoryId(null); }}>
                                        Clear Filters
                                    </Button>
                                )}
                            </Alert>
                        ) : (
                            <Row className="my-4">
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
            `}} />
        </div>
    )
}

export default Page
