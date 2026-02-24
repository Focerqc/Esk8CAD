import { type PageProps } from "gatsby"
import React, { useEffect, useState } from "react"
import { Alert, Container, Row, Col, Card, Button } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import PartCard, { PartSchema } from "../components/PartCard"
import { getSupabaseClient } from "../utils/supabaseClient"

const IdPage: React.FC<PageProps> = ({ location }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [partData, setPartData] = useState<PartSchema | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (typeof window === "undefined") {
            return;
        }

        const fetchPart = async () => {
            // Parse ID from /id/XXXX
            const pathParts = location.pathname.split("/id/");
            if (pathParts.length < 2 || !pathParts[1]) {
                if (isMounted) {
                    setError("Invalid Part ID specified in URL.");
                    setIsLoading(false);
                }
                return;
            }

            // Strip trailing slashes or queries just in case
            const targetId = pathParts[1].replace(/\/$/, "").split("?")[0];

            const client = getSupabaseClient();
            if (!client) {
                if (isMounted) {
                    setError("Database configuration is missing. Cannot fetch part.");
                    setIsLoading(false);
                }
                return;
            }

            try {
                const { data, error: sbError } = await client
                    .from("parts")
                    .select("*")
                    .eq("id", targetId)
                    .single();

                if (sbError) throw sbError;
                if (!data) throw new Error("Part not found.");

                if (isMounted) {
                    const mappedPart: PartSchema = {
                        id: String(data.id),
                        title: data.title || "Untitled Part",
                        image_url: data.image_src || "",
                        author: "Unknown User",
                        boardPlatform: (data.platform && data.platform.length > 0) ? data.platform[0] : "Misc",
                        tags: [...(data.type_of_part || []), ...(data.fabrication_method || [])],
                        externalUrl: data.external_url || undefined,
                    };
                    setPartData(mappedPart);
                    setError(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("[IdPage] Fetch error:", err);
                    if (err.code === "PGRST116" || err.message === "Part not found.") {
                        setError("Part not found in the database. It may have been deleted or never existed.");
                    } else {
                        setError("Database connection failed. Please attempt your search again later.");
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchPart();

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    const renderSkeleton = () => (
        <Row className="my-4">
            {/* Mimics PartCard sizing */}
            <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4 d-flex align-items-stretch" style={{ minWidth: "280px" }}>
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

            {/* Right Column Skeleton */}
            <Col xs={12} sm={6} md={6} lg={8} xl={9} className="mb-4 d-flex align-items-stretch">
                <div className="w-100 h-100 bg-dark border border-secondary rounded flex-column placeholder-glow d-flex align-items-center justify-content-center p-4 min-vh-50">
                    <span className="placeholder col-3 mb-2 bg-secondary rounded py-2"></span>
                    <span className="placeholder col-6 bg-secondary rounded py-4"></span>
                </div>
            </Col>
        </Row>
    );

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <SiteMetaData
                title={partData ? `${partData.title} | ESK8CAD` : "Part Details | ESK8CAD"}
            />

            <header>
                <SiteNavbar />
            </header>

            <main className="flex-grow-1">
                <Container className="py-5">

                    {isLoading && renderSkeleton()}

                    {error && (
                        <div className="py-5 text-center">
                            <Alert variant="danger" className="d-inline-block text-start shadow" style={{ maxWidth: '600px' }}>
                                <h4 className="alert-heading fw-bold">Error Loading Part</h4>
                                <p>{error}</p>
                                <hr />
                                <div className="d-flex justify-content-end">
                                    <Button variant="outline-danger" href="/parts">
                                        Back to Parts
                                    </Button>
                                </div>
                            </Alert>
                        </div>
                    )}

                    {!isLoading && !error && partData && (
                        <>
                            <div className="mb-4 border-bottom border-secondary pb-3">
                                <h1 className="h3 fw-bold mb-0 text-white">{partData.title}</h1>
                                {partData.author && <span className="text-secondary small">Submitted by User: {partData.author}</span>}
                            </div>

                            <Row>
                                {/* Left Column: The PartCard Component acts intrinsically as a Col */}
                                <PartCard part={partData} index={0} />

                                {/* Right Column: Future Content */}
                                <Col xs={12} sm={6} md={6} lg={8} xl={9} className="mb-4 d-flex align-items-stretch">
                                    <div
                                        className="w-100 h-100 border border-secondary rounded d-flex flex-column align-items-center justify-content-center text-center p-4 shadow-sm"
                                        style={{ backgroundColor: '#16191d', minHeight: '300px' }}
                                    >
                                        <h3 className="text-muted fw-bold d-block mb-3 opacity-50">Future: Comments / Stats / 3D Viewer</h3>
                                        <p className="text-secondary small" style={{ maxWidth: '400px' }}>
                                            This section is currently under construction. In the future, community comments, download statistics, and interactive 3D WebGL viewers will be mounted here.
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </>
                    )}

                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .border-secondary { border-color: #24282d !important; }
            `}} />
        </div>
    )
}

export default IdPage
