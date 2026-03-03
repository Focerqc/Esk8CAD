import React, { ChangeEvent, useEffect, useRef, useState, useMemo } from "react"
import { Alert, Button, ButtonGroup, Form, Stack, ToggleButton, Row, Col, Card } from "react-bootstrap"
import { Link } from "gatsby"
import { FaArrowRotateLeft } from "react-icons/fa6"
import windowIsDefined from "../hooks/windowIsDefined"
import CopyLinkButton from "./CopyLinkButton"
import PartCard, { PartSchema } from "./PartCard"
import { useParts } from "../util/parts"
import { useBrandHardware } from "../hooks/useBrandHardware"
import { Part } from "../lib/supabase"

/**
 * Maps Supabase `Part` exactly to the new `PartSchema` expected by `PartCard`
 */
const mapPartToSchema = (part: Part): PartSchema => {
    return {
        id: part.id ? String(part.id) : "Unknown",
        title: part.title || "Untitled Part",
        image_url: part.image_src || "",
        author: "Unknown User", // Assuming author isn't in DB yet, fallback to "Unknown User"
        boardPlatform: (part.platform && part.platform.length > 0) ? part.platform[0] : "Misc",
        tags: [...(part.fabrication_method || [])],
        externalUrl: part.external_url || undefined,
        dropboxUrl: part.dropbox_url || undefined,
        // Optional dropbox link, etc for future use
    }
}

// Helper to deduce platform directly from URL so we don't have to alter every platform page
const getPlatformFromURL = () => {
    if (!windowIsDefined()) return undefined;
    const path = window.location.pathname.toLowerCase();

    // Mapping URL paths to DB Platform items
    if (path.includes('/parts/street')) return 'Street (DIY/Generic)';
    if (path.includes('/parts/offroad')) return 'Off-Road (DIY/Generic)';
    if (path.includes('/parts/3dservisas')) return '3D Servisas';
    if (path.includes('/parts/acedeck')) return 'Acedeck';
    if (path.includes('/parts/apex')) return 'Apex Boards';
    if (path.includes('/parts/backfire')) return 'Backfire';
    if (path.includes('/parts/bioboards')) return 'Bioboards';
    if (path.includes('/parts/boardnamics')) return 'Boardnamics';
    if (path.includes('/parts/defiant')) return 'Defiant Board Society';
    if (path.includes('/parts/evolve')) return 'Evolve';
    if (path.includes('/parts/exway')) return 'Exway';
    if (path.includes('/parts/fluxmotion')) return 'Fluxmotion';
    if (path.includes('/parts/hoyt')) return 'Hoyt St';
    if (path.includes('/parts/lacroix')) return 'Lacroix Boards';
    if (path.includes('/parts/linnpower')) return 'Linnpower';
    if (path.includes('/parts/mboards')) return 'MBoards';
    if (path.includes('/parts/mbs')) return 'MBS';
    if (path.includes('/parts/meepo')) return 'Meepo';
    if (path.includes('/parts/newbee')) return 'Newbee';
    if (path.includes('/parts/propel')) return 'Propel';
    if (path.includes('/parts/radium')) return 'Radium Performance';
    if (path.includes('/parts/stooge')) return 'Stooge Raceboards';
    if (path.includes('/parts/summerboard')) return 'Summerboard';
    if (path.includes('/parts/trampa')) return 'Trampa Boards';
    if (path.includes('/parts/wowgo')) return 'Wowgo';
    if (path.includes('/parts/misc')) return 'Misc';

    return undefined;
};

// Skeleton Placeholder
const SkeletonGrid = () => (
    <Row className="my-5">
        {Array.from({ length: 6 }).map((_, i) => (
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
);

/**
 * Creates a collection of elements for the
 * purpose of filtering an items page under
 * `src/pages/parts` using live Supabase data.
 */
export default ({ platformOverride }: { platformOverride?: string }) => {
    // Check if platform is explicitly passed or try deriving from URL
    const activePlatform = platformOverride || getPlatformFromURL();
    const { parts, isLoading, error } = useParts(activePlatform);

    // Fetch specifically assigned relational models for this specific platform
    const { models: brandModels, isLoading: modelsLoading } = useBrandHardware(activePlatform ? [activePlatform] : []);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // Dynamic extraction of Fabrication Methods across all available parts for this page
    const uniqueFabricationMethods = useMemo(() => {
        return [...new Set(parts.map((p) => (p.fabrication_method || [])).filter(Boolean).flat())].sort((a, b) => a.localeCompare(b)) as string[];
    }, [parts]);

    // Checkbox useState object lists
    const [searchText, setSearchText] = useState("")
    const [checkedFabricationMethodBoxes, setCheckedFabricationMethodBoxes] = useState<Record<string, boolean>>({})

    const didMount = useRef(false)

    // Sync init states when dynamic attributes fetch
    useEffect(() => {
        if (!isLoading && parts.length > 0) {
            setCheckedFabricationMethodBoxes(Object.fromEntries(uniqueFabricationMethods.map((p) => [p, false])));
        }
    }, [isLoading, parts.length])

    const clearSearch = () => {
        setSearchText("")
        setCheckedFabricationMethodBoxes(Object.fromEntries(uniqueFabricationMethods.map((p) => [p, false])))
    }

    //#region Query Parameter Pre-Filtering

    if (!didMount.current && windowIsDefined()) {
        const queryParams = new URLSearchParams(window.location.search)

        const keyword = queryParams.get("keyword") ?? queryParams.get("search") ?? ""
        if (keyword) {
            setSearchText(decodeURIComponent(keyword))
        }

        const fabricationMethod = (queryParams.get("fab")?.split(",") ?? queryParams.get("fabrication")?.split(",") ?? []) as string[]
        if (fabricationMethod && fabricationMethod.every((f) => uniqueFabricationMethods.includes(f))) {
            const tempCheckedBoxes = Object.fromEntries(uniqueFabricationMethods.map((p) => [p, false]))
            fabricationMethod.forEach((f) => tempCheckedBoxes[f] = true)
            setCheckedFabricationMethodBoxes(tempCheckedBoxes)
        }

        didMount.current = true
    }

    //#endregion

    const handleFabricationMethodCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
        setCheckedFabricationMethodBoxes({ ...checkedFabricationMethodBoxes, [e.target.name]: e.target.checked })
    }

    const showCopySearchButton = useMemo(() => {
        return !!(
            searchText
            || Object.values(checkedFabricationMethodBoxes).some((v) => !!v)
        );
    }, [searchText, checkedFabricationMethodBoxes]);

    const filteredParts = useMemo(() => {
        return parts.filter(part => {
            const partPlatforms = part.platform || [];
            const partFabs = part.fabrication_method || [];

            const searchTerm = searchText.toLowerCase().trim();
            const keywordMatch = !searchTerm || (
                (part.title?.toLowerCase().includes(searchTerm)) ||
                (partPlatforms.some(p => p?.toLowerCase().includes(searchTerm))) ||
                (partFabs.some(t => t?.toLowerCase().includes(searchTerm)))
            );

            const fabBoxesActive = Object.values(checkedFabricationMethodBoxes).some(v => !!v);
            const fabMatch = !fabBoxesActive || partFabs.some(f => !!checkedFabricationMethodBoxes[f]);

            const modelMatch = !selectedModel || part.board_model === selectedModel;

            return keywordMatch && fabMatch && modelMatch;
        });
    }, [parts, searchText, checkedFabricationMethodBoxes, selectedModel]);

    return (
        <>
            {activePlatform && (
                <Row className="mb-4 pb-4 border-bottom border-secondary">
                    <Col xs={12} md={9} className="text-start">
                        <h2 className="display-4 fw-bold mb-4 text-white text-uppercase" style={{ letterSpacing: '0.1rem' }}>
                            {activePlatform} <span style={{ color: '#0dcaf0' }}>PARTS</span>
                        </h2>

                        <h5 className="text-uppercase text-secondary fw-bold mb-3">BOARD MODELS</h5>

                        {modelsLoading ? (
                            <div className="placeholder-glow w-100" style={{ minHeight: "40px" }}>
                                <div className="mb-3 d-flex gap-2">
                                    <span className="placeholder col-2 rounded-pill py-3"></span>
                                    <span className="placeholder col-3 rounded-pill py-3"></span>
                                    <span className="placeholder col-2 rounded-pill py-3"></span>
                                </div>
                            </div>
                        ) : brandModels && brandModels.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2 pe-md-4">
                                <Button
                                    variant={selectedModel === null ? "info" : "outline-info"}
                                    className="fw-bold rounded-pill px-4 btn-sm text-uppercase border-secondary shadow-sm"
                                    onClick={() => setSelectedModel(null)}
                                >
                                    All Models
                                </Button>
                                {brandModels.map(m => (
                                    <Button
                                        key={`model-${m}`}
                                        variant={selectedModel === m ? "info" : "outline-secondary"}
                                        className="fw-bold rounded-pill px-4 btn-sm text-uppercase shadow-sm pe-auto"
                                        onClick={() => setSelectedModel(m)}
                                    >
                                        {m}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted small fst-italic">No specific hardware models currently registered for this brand.</div>
                        )}
                    </Col>

                    {/* Empty placeholder column to enforce layout alignment */}
                    <Col xs={12} md={3} className="d-none d-md-block"></Col>
                </Row>
            )}

            <div className="searchArea mb-5">
                <Stack direction="vertical" gap={3}>
                    {/* Pretty Rounded Search Bar */}
                    <div className="searchKeyword w-100">
                        <Form.Control
                            as="input"
                            type="search"
                            id="inputSearch"
                            value={searchText}
                            placeholder="Search text to filter by..."
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-100 rounded-pill p-3 border-0 shadow-sm fw-bold bg-white text-dark"
                            style={{ maxWidth: '100%', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                    </div>

                    {uniqueFabricationMethods.length > 0 &&
                        <div className="searchFabricationCheckBoxes d-flex flex-column gap-2 mt-2">
                            <Form.Label className="mb-0 fw-bold fs-6 text-light">
                                Fabrication Method(s):
                            </Form.Label>

                            <ButtonGroup size="sm" className="d-flex flex-wrap gap-2" style={{ maxWidth: "max-content" }}>
                                {uniqueFabricationMethods.map((f, index) => (
                                    <ToggleButton
                                        key={`fabricationMethod-${index}`}
                                        checked={checkedFabricationMethodBoxes[f] || false}
                                        onChange={handleFabricationMethodCheckbox}
                                        name={f}
                                        id={f}
                                        type="checkbox"
                                        value={1}
                                        variant="outline-info"
                                        className="rounded px-3 py-1"
                                        style={{ borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", borderTopRightRadius: "6px", borderBottomRightRadius: "6px" }}
                                    >
                                        {f}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </div>
                    }

                    <Stack direction="horizontal" gap={2} className="mt-3">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline-info"
                            style={{ display: showCopySearchButton ? "initial" : "none", maxWidth: "max-content" }}
                            onClick={() => clearSearch()}>
                            Clear Search <FaArrowRotateLeft />
                        </Button>

                        <CopyLinkButton
                            text="Copy This Search"
                            link={!windowIsDefined() ? "#" : "http://" + window.location.host + window.location.pathname + `?search=${encodeURIComponent(searchText)}` + `&fab=${uniqueFabricationMethods.filter((f) => !!checkedFabricationMethodBoxes[f])}`}
                            style={{ display: showCopySearchButton ? "initial" : "none", maxWidth: "max-content" }} />
                    </Stack>
                </Stack>
            </div>

            {/* Defensive Coding Data Display: Skeleton Loading Grid, Error, Gallery Map */}
            {isLoading && <SkeletonGrid />}

            {error && (
                <Alert variant="danger" className="my-4">
                    <strong>Error loading parts:</strong> {error}
                    {error.includes("Failed to fetch") && (
                        <div className="mt-2 text-muted small">
                            <em>Diagnostics: This network error typically means the database URL is missing or improperly formatted. Check browser environment variables.</em>
                        </div>
                    )}
                </Alert>
            )}

            {!isLoading && !error && (
                <>
                    <h2 id="itemListHeader" className="mb-4" style={{ display: filteredParts.length > 0 ? "block" : "none" }}>Items From Cloud DB</h2>
                    <h2 id="noResultsText" style={{ display: filteredParts.length === 0 && parts.length > 0 ? "block" : "none", minHeight: "200px" }}>No results.</h2>

                    {/* Show a clear fallback message if filtering leaves zero rows */}
                    {parts.length === 0 ? (
                        <Alert variant="info" className="my-5 py-4 text-center border-0 shadow-sm" style={{ backgroundColor: "#1a1d20", minHeight: "150px" }}>
                            <h4 className="fw-bold mb-2 text-info">No parts found</h4>
                            <p className="mb-0 text-light opacity-75">There are currently no parts available for {activePlatform ? `the ${activePlatform} platform` : 'this search'} in the database.</p>
                        </Alert>
                    ) : (
                        <Row>
                            {filteredParts.map((part, index) => (
                                <PartCard key={`part-card-${part.id}-${index}`} part={mapPartToSchema(part)} index={index} />
                            ))}
                        </Row>
                    )}
                </>
            )}
        </>
    )
}
