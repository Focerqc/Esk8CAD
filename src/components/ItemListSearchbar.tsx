import React, { ChangeEvent, useEffect, useRef, useState, useMemo } from "react"
import { Alert, Button, ButtonGroup, Form, Stack, ToggleButton, Row, Col, Card, Badge } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { FaArrowRotateLeft } from "react-icons/fa6"
import windowIsDefined from "../hooks/windowIsDefined"
import CopyLinkButton from "./CopyLinkButton"
import PartCard, { PartSchema } from "./PartCard"
import { useParts } from "../util/parts"
import { useBrandHardware } from "../hooks/useBrandHardware"
import { Part as OldPart } from "../lib/supabase"
import { useBoardHook } from "../hooks/useBoardHook"

/**
 * Maps Supabase `Part` exactly to the new `PartSchema` expected by `PartCard`
 */
const mapPartToSchema = (part: any): PartSchema => {
    return {
        id: part.id ? String(part.id) : "Unknown",
        title: part.title || "Untitled Part",
        image_url: (typeof part.image_src === 'string' ? part.image_src : part.image_src?.[0]) || "",
        author: part.author || "Unknown User",
        boardPlatform: part.brands?.name || (part.platform && part.platform.length > 0 ? part.platform[0] : "Misc"),
        tags: [
            ...(part.part_categories?.name ? [part.part_categories.name] : (part.type_of_part || [])),
            ...(part.fabrication_methods?.name ? [part.fabrication_methods.name] : (part.fabrication_method || [])),
            ...(part.board_model ? [part.board_model] : []),
        ],
        externalUrl: part.external_url || undefined,
        dropboxUrl: part.dropbox_url || undefined,
        brands: part.brands || null,
        part_categories: part.part_categories || null,
        fabrication_methods: part.fabrication_methods || null,
        models: part.models || null,
        attributes: part.attributes || {},
    }
}

// Helper to deduce category from URL (/parts/tags/category-name)
const getCategoryFromURL = () => {
    if (!windowIsDefined()) return null;
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/parts/tags/')) {
        return path.split('/parts/tags/')[1].replace(/\/$/, '');
    }
    if (path.includes('/tags/')) {
        return path.split('/tags/')[1].replace(/\/$/, '');
    }
    return null;
}

// Helper to deduce platform directly from URL
const getPlatformFromURL = () => {
    if (!windowIsDefined()) return undefined;
    const path = window.location.pathname.toLowerCase();
    const segments = path.split('/').filter(Boolean);

    if (segments.length >= 1) {
        let platformKey = segments[0];

        // If using universal brand route
        if (platformKey === 'brand' && segments.length >= 2) {
            platformKey = segments[1];
        }
        
        // Skip non-platform root pages
        const nonPlatformRoots = ['admin', 'submit', 'id', 'oem', 'resources', 'tags', 'fosterqc', 'parts'];
        if (nonPlatformRoots.includes(platformKey)) return undefined;

        return platformKey.toLowerCase();
    }

    return undefined;
};

// Helper to deduce model from URL (/brand/models/model-name)
const getModelFromURL = () => {
    if (!windowIsDefined()) return null;
    const path = window.location.pathname.toLowerCase();
    const segments = path.split('/').filter(Boolean);
    const isUniversal = segments[0] === 'brand';
    const modelsIndex = isUniversal ? 2 : 1;
    const modelNameIndex = isUniversal ? 3 : 2;

    if (segments.length > modelNameIndex && segments[modelsIndex] === 'models') {
        return segments[modelNameIndex]; // Return the raw slug for precise comparison
    }
    return null;
};

// ... SkeletonGrid ...

const SkeletonGrid = () => (
    <Row>
        {[1, 2, 3, 4, 5, 6].map(i => (
            <Col key={`skeleton-${i}`} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 shadow-sm border-secondary bg-black" style={{ minHeight: '320px', opacity: 0.1 }}>
                    <div className="card-img-holder placeholder-glow bg-secondary" style={{ aspectRatio: "16 / 9" }}>
                        <div className="placeholder w-100 h-100"></div>
                    </div>
                    <Card.Body className="d-flex flex-column gap-2 p-3">
                        <div className="placeholder-glow"><span className="placeholder col-8 bg-secondary"></span></div>
                        <div className="placeholder-glow"><span className="placeholder col-4 bg-secondary"></span></div>
                    </Card.Body>
                </Card>
            </Col>
        ))}
    </Row>
);

export default ({ platformOverride }: { platformOverride?: string }) => {
    const navigate = useNavigate();
    const activePlatform = useMemo(() => {
        const platform = platformOverride || getPlatformFromURL() || null;
        return platform ? platform.toLowerCase() : null;
    }, [platformOverride]);
    const urlCategory = useMemo(() => getCategoryFromURL(), []);

    // State
    const [searchText, setSearchText] = useState("");
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [urlModelSynced, setUrlModelSynced] = useState(false);

    const [checkedFabricationMethodBoxes, setCheckedFabricationMethodBoxes] = useState<{ [key: string]: boolean }>({});

    // Hooks
    const { brands: allBrands } = useBoardHook();

    const currentBrand = useMemo(() => {
        if (!activePlatform) return null;
        return allBrands.find(b => b.safe_slug === activePlatform.toLowerCase()) || 
               allBrands.find(b => b.name.toLowerCase() === activePlatform.toLowerCase()) || null;
    }, [allBrands, activePlatform]);

    const resolvedDisplayName = currentBrand ? currentBrand.name : (activePlatform || undefined);

    // Pass the raw activePlatform (slug) to the hooks
    const { parts, isLoading, error } = useParts(activePlatform || undefined, urlCategory || undefined);
    const { models: brandModels, isLoading: modelsLoading } = useBrandHardware(currentBrand?.id || activePlatform || null);

    // Sync model from URL on mount
    useEffect(() => {
        if (!modelsLoading && brandModels.length > 0 && !urlModelSynced) {
            const urlModelSlug = getModelFromURL();
            if (urlModelSlug) {
                const found = brandModels.find(m => m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === urlModelSlug.toLowerCase());
                if (found) setSelectedModel(found.name);
            }
            setUrlModelSynced(true);
        }
    }, [brandModels, modelsLoading, urlModelSynced]);

    const handleModelSelect = (modelName: string | null) => {
        setSelectedModel(modelName);
        if (windowIsDefined() && activePlatform) {
            const segments = window.location.pathname.split('/').filter(Boolean);
            const isUniversal = segments[0] === 'brand';

            // Use exact known safe slug from DB or fallback
            const brandSlug = currentBrand?.safe_slug || activePlatform;

            let targetBase = isUniversal ? `brand/${segments[1]}` : brandSlug;

            if (modelName) {
                const modelSlug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                navigate(`/${targetBase}/models/${modelSlug}`, { replace: true });
            } else {
                navigate(`/${targetBase}`, { replace: true });
            }
        }
    };

    // Filter Logic
    const uniqueFabricationMethods = useMemo(() => {
        const methods = new Set<string>();
        parts.forEach(p => {
            if (p.fabrication_methods?.name) {
                methods.add(p.fabrication_methods.name);
            }
        });
        return Array.from(methods).sort();
    }, [parts]);

    const uniqueBoardModels = useMemo(() => {
        const models = new Set<string>();
        parts.forEach(p => {
            if (p.board_model) models.add(p.board_model);
        });
        return Array.from(models).sort();
    }, [parts]);

    const filteredParts = useMemo(() => {
        return parts.filter(p => {
            const matchesSearch = p.title?.toLowerCase().includes(searchText.toLowerCase());
            const matchesModel = !selectedModel || p.board_model === selectedModel;

            const activeMethods = Object.keys(checkedFabricationMethodBoxes).filter(k => checkedFabricationMethodBoxes[k]);
            const matchesFabrication = activeMethods.length === 0 ||
                (p.fabrication_methods?.name && activeMethods.includes(p.fabrication_methods.name));

            return matchesSearch && matchesModel && matchesFabrication;
        });
    }, [parts, searchText, selectedModel, checkedFabricationMethodBoxes]);

    const featuredModel = useMemo(() => {
        if (!selectedModel) return null;
        return brandModels.find(m => m.name === selectedModel) || null;
    }, [selectedModel, brandModels]);

    const showCopySearchButton = searchText.length > 0 || Object.values(checkedFabricationMethodBoxes).some(v => v);

    const handleFabricationMethodCheckbox = (e: any) => {
        const { name, checked } = e.target;
        setCheckedFabricationMethodBoxes(prev => ({ ...prev, [name]: checked }));
    };

    const clearSearch = () => {
        setSearchText("");
        setCheckedFabricationMethodBoxes({});
        setSelectedModel(null);
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                .brand-header-box {
                    background: #0B0E14;
                    border: 1px solid #1a1d20;
                    border-radius: 2rem;
                    overflow: hidden;
                    box-shadow: 0 1rem 3rem rgba(0,0,0,0.5);
                }
                .featured-model-card {
                    background: rgba(11, 14, 20, 0.5);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                    border-radius: 1.5rem;
                    backdrop-filter: blur(10px);
                }
                .accent-cyan { color: #00E5FF; }
                .bg-accent-cyan-subtle { background: rgba(0, 229, 255, 0.1); }
                .border-accent-cyan-subtle { border-color: rgba(0, 229, 255, 0.2); }
                .text-tracking-widest { letter-spacing: 0.3em; }
                .font-black { font-weight: 900; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                
                /* High-Contrast Search Bar */
                .search-input-custom {
                    background: #111418 !important;
                    border: 1px solid #24282d !important;
                    color: white !important;
                    font-weight: 600;
                    padding: 1.25rem 1.5rem !important;
                    border-radius: 1rem !important;
                    transition: all 0.2s ease;
                }
                .search-input-custom:focus {
                    background: #161a1f !important;
                    border-color: #0dcaf0 !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 202, 240, 0.1) !important;
                    outline: none;
                }
                .search-input-custom::placeholder {
                    color: rgba(255,255,255,0.7) !important;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.1em;
                }
            `}} />

            {activePlatform && (
                <div className="brand-header-box mb-5 overflow-hidden">
                    <Row className="g-0">
                        {/* Left Column: Title & Filters */}
                        <Col lg={5} className="p-4 p-md-5 border-bottom border-lg-bottom-0 border-lg-end border-secondary d-flex flex-column justify-content-center position-relative">
                            <div className="position-relative z-index-1">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="bg-info" style={{ height: '2px', width: '40px' }}></div>
                                    <span className="text-info text-uppercase fw-bold small text-tracking-widest">{urlCategory ? "Sitewide Filter" : "Hardware Repository"}</span>
                                </div>
                                <h1 className="display-4 fw-black text-white text-uppercase mb-4" style={{ letterSpacing: '-0.02em' }}>
                                    {resolvedDisplayName || (urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : "Catalog")}
                                </h1>

                                <h6 className="text-secondary text-uppercase fw-bold small text-tracking-widest mb-3 italic">{activePlatform ? "Select Board Model" : "Models Available"}</h6>
                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                        variant={selectedModel === null ? "info" : "outline-light"}
                                        size="sm"
                                        className={`px-4 py-2 rounded-3 text-uppercase fw-bold small ${selectedModel === null ? 'bg-accent-cyan-subtle text-info border-accent-cyan-subtle' : 'text-light border-secondary opacity-75'}`}
                                        onClick={() => handleModelSelect(null)}
                                    >
                                        All Models
                                    </Button>
                                    {brandModels.map(m => (
                                        <Button
                                            key={`model-${m.id}`}
                                            variant={selectedModel === m.name ? "info" : "outline-light"}
                                            size="sm"
                                            className={`px-4 py-2 rounded-3 text-uppercase fw-bold small ${selectedModel === m.name ? 'bg-accent-cyan-subtle text-info border-accent-cyan-subtle' : 'text-light border-secondary opacity-75'}`}
                                            onClick={() => handleModelSelect(m.name)}
                                        >
                                            {m.name}
                                        </Button>
                                    ))}

                                </div>
                            </div>
                        </Col>

                        {/* Right Column: Featured Box */}
                        <Col lg={7} className="p-4 p-md-5 bg-dark bg-opacity-25">
                            <Card className="featured-model-card h-100 border-0 p-4">
                                {featuredModel ? (
                                    <Row className="h-100 align-items-center g-4">
                                        <Col md={4} className="mb-4 mb-md-0">
                                            <div className="bg-black rounded-4 border border-secondary p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ aspectRatio: '1/1' }}>
                                                {featuredModel.image_url ? (
                                                    <img src={featuredModel.image_url} alt={featuredModel.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <div className="display-4 text-secondary opacity-10 italic fw-black text-center">X</div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={8}>
                                            <h3 className="text-white fw-black text-uppercase italic mb-4" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>{featuredModel.name}</h3>
                                            <div>
                                                <div className="text-secondary text-uppercase fw-bold small text-tracking-widest mb-2" style={{ fontSize: '10px', opacity: 0.8 }}>Tech Readout</div>
                                                <p className="text-light font-monospace mb-0" style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                                                    {featuredModel.description?.trim() || "AWAITING ADMINISTRATIVE HARDWARE ENTRY."}
                                                </p>
                                            </div>
                                        </Col>
                                    </Row>
                                ) : (
                                    <Row className="h-100 align-items-center g-4">
                                        <Col md={4} className="mb-4 mb-md-0">
                                            <div className="bg-black rounded-4 border border-secondary p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ aspectRatio: '1/1' }}>
                                                {currentBrand?.image_url && !currentBrand.image_url.includes('placeholder.png') ? (
                                                    <img src={currentBrand.image_url} alt={currentBrand.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <div className="display-1 text-secondary opacity-10 italic fw-black text-center">i</div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={8}>
                                            <h2 className="text-white fw-black text-uppercase italic mb-1" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>{resolvedDisplayName}</h2>
                                            <div className="text-info text-uppercase fw-bold small text-tracking-widest mb-4" style={{ fontSize: '10px' }}>Hardware Repository</div>
                                            <p className="text-light font-monospace mb-0" style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                                                {currentBrand?.description || "AWAITING ADMINISTRATIVE DOCUMENTATION SYNC FOR THIS HARDWARE PLATFORM."}
                                            </p>
                                        </Col>
                                    </Row>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {!activePlatform && uniqueBoardModels.length > 0 && (
                <div className="mb-5 p-4 bg-dark bg-opacity-25 border border-secondary rounded-4 shadow-sm">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-info" style={{ height: '2px', width: '30px' }}></div>
                        <span className="text-secondary text-uppercase fw-bold small text-tracking-widest" style={{ fontSize: '11px' }}>Filter by Hardware Model</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Button
                            variant={selectedModel === null ? "info" : "outline-light"}
                            size="sm"
                            className={`px-3 py-1 rounded-3 text-uppercase fw-bold small ${selectedModel === null ? 'bg-accent-cyan-subtle text-info border-accent-cyan-subtle' : 'text-light border-secondary opacity-50'}`}
                            onClick={() => setSelectedModel(null)}
                        >
                            All Models
                        </Button>
                        {uniqueBoardModels.map(modelName => (
                            <Button
                                key={`filter-model-${modelName}`}
                                variant={selectedModel === modelName ? "info" : "outline-light"}
                                size="sm"
                                className={`px-3 py-1 rounded-3 text-uppercase fw-bold small ${selectedModel === modelName ? 'bg-accent-cyan-subtle text-info border-accent-cyan-subtle' : 'text-light border-secondary opacity-50'}`}
                                onClick={() => setSelectedModel(modelName)}
                            >
                                {modelName}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="searchArea mb-5">
                <Stack direction="vertical" gap={3}>
                    <div className="searchKeyword position-relative">
                        <Form.Control
                            type="search"
                            value={searchText}
                            placeholder="Filter parts catalog..."
                            onChange={(e) => setSearchText(e.target.value)}
                            className="search-input-custom shadow-lg"
                        />
                        {searchText && (
                            <button
                                onClick={() => setSearchText("")}
                                className="position-absolute end-0 top-50 translate-middle-y me-3 btn btn-link text-secondary p-0"
                            >
                                <FaArrowRotateLeft size={14} />
                            </button>
                        )}
                    </div>

                    <div className="d-flex flex-column flex-md-row gap-4 justify-content-between align-items-md-center">
                        {uniqueFabricationMethods.length > 0 &&
                            <div className="d-flex flex-column gap-2">
                                <label className="text-secondary text-uppercase fw-bold small text-tracking-widest">Fabrication Methods</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {uniqueFabricationMethods.map((f, index) => (
                                        <Button
                                            key={`fab-${index}`}
                                            variant={checkedFabricationMethodBoxes[f] ? "info" : "outline-light"}
                                            size="sm"
                                            className={`px-3 py-1 text-uppercase fw-black small border-secondary ${checkedFabricationMethodBoxes[f] ? 'text-white shadow-sm' : 'text-light opacity-50'}`}
                                            style={{ fontSize: '10px', letterSpacing: '0.05em' }}
                                            onClick={() => setCheckedFabricationMethodBoxes(prev => ({ ...prev, [f]: !prev[f] }))}
                                        >
                                            {f}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        }

                        <div className="d-flex gap-2">
                            {showCopySearchButton && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="text-uppercase fw-bold small px-4 py-2"
                                    onClick={clearSearch}
                                >
                                    Reset
                                </Button>
                            )}
                            <CopyLinkButton
                                text="Copy Link"
                                link={!windowIsDefined() ? "#" : `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(searchText)}&fab=${uniqueFabricationMethods.filter(f => checkedFabricationMethodBoxes[f]).join(',')}`}
                                style={{ display: showCopySearchButton ? "block" : "none" }}
                            />
                        </div>
                    </div>
                </Stack>
            </div>

            {isLoading && <SkeletonGrid />}

            {error && (
                <Alert variant="danger" className="my-5 shadow-sm border-danger bg-dark text-danger p-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-danger bg-opacity-25 d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>!</div>
                        <div>
                            <h6 className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.1em' }}>Sync Failure</h6>
                            <p className="small mb-0 opacity-75">{error}</p>
                        </div>
                    </div>
                </Alert>
            )}

            {!isLoading && !error && (
                <div className="mt-5">
                    <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
                        <h2 className="h6 fw-bold text-uppercase text-white mb-0" style={{ letterSpacing: '0.3em' }}>
                            Assets
                        </h2>
                        <Badge bg="dark" className="border border-secondary px-3 py-1 text-secondary small">
                            {filteredParts.length} Records
                        </Badge>
                    </div>

                    {parts.length === 0 ? (
                        <div className="py-5 text-center bg-dark bg-opacity-25 rounded-4 border border-secondary border-dashed">
                            <div className="display-6 mb-3 text-secondary opacity-25 italic">Empty</div>
                            <h5 className="fw-bold text-info text-uppercase mb-2" style={{ letterSpacing: '0.1em' }}>No Parts Registered</h5>
                            <p className="small text-muted text-uppercase mb-0">Check back later or contribute hardware files to this platform.</p>
                        </div>
                    ) : filteredParts.length === 0 ? (
                        <div className="py-5 text-center">
                            <h5 className="fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Refine Search</h5>
                            <p className="small text-muted text-uppercase mb-0">No assets match your current filtering criteria.</p>
                        </div>
                    ) : (
                        <Row className="g-4">
                            {filteredParts.map((part, index) => (
                                <PartCard key={`part-card-${part.id}-${index}`} part={mapPartToSchema(part)} index={index} />
                            ))}
                        </Row>
                    )}
                </div>
            )}
        </>
    )
}

