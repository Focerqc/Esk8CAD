import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from "react"
import { Container, Row, Col, Offcanvas, Form, InputGroup, Button, Card, Badge as RBABadge } from "react-bootstrap"
import { motion, AnimatePresence } from "framer-motion"
import SiteNavbar from "../../components/SiteNavbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import PartCard, { PartSchema } from "../../components/PartCard"
import FilterSidebar from "../../components/FilterSidebar"
import SkeletonCard from "../../components/SkeletonCard"
import { useParts, Part } from "../../util/parts"
import { AttributeTemplate, matchesFilters } from "../../util/filterUtils"
import { getSupabaseClient } from "../../lib/supabase"
import { useFilterUrlSync } from "../../hooks/useFilterUrlSync"
import { FaMagnifyingGlass, FaXmark, FaFilter, FaArrowRotateLeft } from "react-icons/fa6"
import { LucideSearchX } from "lucide-react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useBoardHook } from "../../hooks/useBoardHook"
import "../../scss/pages/items.scss"

const CatalogPage: React.FC = () => {
    const { brand: pathBrand, model: pathModel } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { parts, isLoading } = useParts();
    const [categoryTemplatesMap, setCategoryTemplatesMap] = useState<Record<string, AttributeTemplate[]>>({});
    const { groupedModels, brands: allBrands } = useBoardHook();
    
    // Page State
    const [activeFilters, _setActiveFilters] = useState<Record<string, any>>({});

    // Wrapped setter to remove orphaned category fields
    const setActiveFilters = useCallback((valueOrUpdater: React.SetStateAction<Record<string, any>>) => {
        _setActiveFilters(prev => {
            const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
            
            const prevCats = Array.isArray(prev.Category) ? prev.Category : [];
            const nextCats = Array.isArray(next.Category) ? next.Category : [];
            const removedCats = prevCats.filter(c => !nextCats.includes(c));

            if (removedCats.length > 0) {
                const fieldsToRemove = new Set<string>();
                removedCats.forEach((catName: string) => {
                    const fields = categoryTemplatesMap[catName];
                    if (fields) fields.forEach(f => fieldsToRemove.add(f.key));
                });

                nextCats.forEach((catName: string) => {
                    const fields = categoryTemplatesMap[catName];
                    if (fields) fields.forEach(f => fieldsToRemove.delete(f.key));
                });

                if (fieldsToRemove.size > 0) {
                    const cleanedNext = { ...next };
                    let cleaned = false;
                    fieldsToRemove.forEach(fieldKey => {
                        if (fieldKey in cleanedNext) {
                            delete cleanedNext[fieldKey];
                            cleaned = true;
                        }
                    });
                    return cleaned ? cleanedNext : next;
                }
            }
            return next;
        });
    }, [categoryTemplatesMap]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    // Initial Path Param Handling: Sync :brand and :model from URL path to state ONCE
    useEffect(() => {
        if (pathBrand && allBrands.length > 0) {
            // Find the proper display name for the brand from the slug
            const brandObj = allBrands.find(b => 
                b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === pathBrand.toLowerCase() ||
                b.name.toLowerCase() === pathBrand.toLowerCase() ||
                (b as any).safe_slug === pathBrand.toLowerCase()
            );
            const brandName = brandObj ? brandObj.name : pathBrand;
            
            setActiveFilters(prev => ({
                ...prev,
                Brand: [brandName],
                ...(pathModel ? { Model: [pathModel] } : {})
            }));
        }
    }, [pathBrand, pathModel, allBrands]);

    // Sync state with URL query parameters seamlessly
    useFilterUrlSync(activeFilters, searchTerm, setActiveFilters, setSearchTerm);

    // Hard-sync on client-side navigation (e.g. clicking Catalog or OEM link)
    useEffect(() => {
        // If we navigating EXACTLY to /parts with NO search params
        if (location.pathname === '/parts' && !location.search) {
            const hasFilters = Object.keys(activeFilters).length > 0 || searchTerm !== '';
            if (hasFilters) {
                setActiveFilters({});
                setSearchTerm('');
            }
        }
        // If we navigate to /parts?brand=OEM (or similar), we must parse it because useFilterUrlSync only parses on mount
        else if (location.pathname === '/parts' && location.search) {
            const params = new URLSearchParams(location.search);
            const brandOverride = params.get('brand') || params.get('Brand');
            if (brandOverride && activeFilters.Brand?.[0] !== brandOverride) {
                // Keep ONLY the brand filter to match what they just clicked
                setActiveFilters({ Brand: [brandOverride] });
                setSearchTerm('');
            }
        }
    }, [location.pathname, location.search]);

    // Responsive sidebar handling
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 992;
            setIsMobileScreen(isMobile);
            if (isMobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Attribute Templates
    useEffect(() => {
        const fetchTemplates = async () => {
            const client = getSupabaseClient();
            if (!client) return;
            const { data, error } = await client.from('part_categories').select('name, template_fields');
            if (data && !error) {
                const templatesByCat: Record<string, AttributeTemplate[]> = {};
                data.forEach((cat: any) => {
                    if (cat.name && cat.template_fields && Array.isArray(cat.template_fields)) {
                        templatesByCat[cat.name] = cat.template_fields;
                    }
                });
                setCategoryTemplatesMap(templatesByCat);
            }
        };
        fetchTemplates();
    }, []);

    // Mix in Brand, Model, and Category as dynamic filter templates
    const fullAttributeTemplates = useMemo(() => {
        const brandOptions = Array.from(new Set(parts.map(p => p.brands?.name).filter(Boolean))) as string[];
        const categoryOptions = Array.from(new Set(parts.map(p => p.part_categories?.name).filter(Boolean))) as string[];
        const modelOptions = Array.from(new Set(parts.map(p => p.models?.name).filter(Boolean))) as string[];

        const rootTemplates: AttributeTemplate[] = [
            { key: 'Brand', type: 'array', options: brandOptions.sort() },
            { key: 'Model', type: 'array', options: modelOptions.sort() },
            { key: 'Category', type: 'array', options: categoryOptions.sort() }
        ];

        const activeCategories: string[] = Array.isArray(activeFilters.Category) ? activeFilters.Category : [];
        const dynamicTemplatesMap = new Map<string, AttributeTemplate>();

        activeCategories.forEach(catName => {
            const fields = categoryTemplatesMap[catName];
            if (fields) {
                fields.forEach((tf: AttributeTemplate) => {
                    if (!dynamicTemplatesMap.has(tf.key)) {
                        dynamicTemplatesMap.set(tf.key, { ...tf });
                    }
                });
            }
        });

        const dynamicTemplates = Array.from(dynamicTemplatesMap.values());
        
        // Aggregate options for all enum-like templates that don't have them
        dynamicTemplates.forEach(template => {
            if (template.type === 'enum' || template.type === 'array' || template.type === 'string' || (template.type as string) === 'text') {
                if (!template.options || template.options.length === 0) {
                    const values = new Set<string>();
                    parts.forEach(p => {
                        const val = p.attributes?.[template.key];
                        if (val) {
                            if (Array.isArray(val)) val.forEach(v => values.add(String(v)));
                            else values.add(String(val));
                        }
                    });
                    if (values.size > 0) {
                        template.options = Array.from(values).sort();
                    }
                }
            }
        });

        return [...rootTemplates, ...dynamicTemplates];
    }, [parts, categoryTemplatesMap, activeFilters.Category]);

    // Active Brand and Model for the "Platform Hub" header
    const activeBrandName = activeFilters.Brand?.[0];
    const activeModelName = activeFilters.Model?.[0];

    const currentBrand = useMemo(() => {
        if (!activeBrandName) return null;
        return allBrands.find(b => b.name === activeBrandName) || null;
    }, [activeBrandName, allBrands]);

    const featuredModel = useMemo(() => {
        if (!activeModelName || !activeBrandName) return null;
        const brandModels = groupedModels[activeBrandName] || [];
        // Matching by name or by "safe slug" if name is missing
        return brandModels.find(m => m.name === activeModelName || m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeModelName.toLowerCase()) || null;
    }, [activeModelName, activeBrandName, groupedModels]);

    const handleModelToggle = (model: string) => {
        setActiveFilters(prev => {
            const currentModels = prev.Model || [];
            if (currentModels.includes(model)) {
                const next = currentModels.filter((m: string) => m !== model);
                return { ...prev, Model: next.length ? next : undefined };
            } else {
                return { ...prev, Model: [model] };
            }
        });
    };

    // Filter Logic
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const deferredActiveFilters = useDeferredValue(activeFilters);

    const filteredParts = useMemo(() => {
        return parts.filter((part) => {
            const matchesText = deferredSearchTerm.trim() === '' || 
                (part.title?.toLowerCase().includes(deferredSearchTerm.toLowerCase().trim()));
            if (!matchesText) return false;
            return matchesFilters(part, deferredActiveFilters);
        });
    }, [parts, deferredActiveFilters, deferredSearchTerm]);

    const clearAllFilters = () => {
        setActiveFilters({});
        setSearchTerm('');
    };

    const activeFilterCount = Object.keys(activeFilters).length;

    // Strict PartSchema mapper to satisfy typechecking
    const mapPartToSchema = (part: Part): PartSchema => ({
        id: String(part.id),
        title: part.title || 'Untitled',
        image_url: part.image_src || '',
        author: part.author || 'Anonymous',
        boardPlatform: part.brands?.name || 'Unknown',
        tags: part.type_of_part || [],
        externalUrl: part.external_url || undefined,
        dropboxUrl: part.dropbox_url || undefined,
        brands: part.brands || null,
        part_categories: part.part_categories || null,
        fabrication_methods: part.fabrication_methods || null,
        models: part.models || null,
        attributes: part.attributes || {},
    });

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-0 page-items overflow-x-hidden">
            <SiteMetaData title={`${activeBrandName ? `${activeBrandName} Parts` : 'Catalog'} | ESK8CAD.COM`} />
            <header>
                <SiteNavbar />
                {/* Only show the large title if we DON'T have a brand hub header active */}
                {!currentBrand && (
                    <h1 className="flex-center uppercase letter-spacing-2 mt-5 mb-0" style={{ fontWeight: 900 }}>
                        ALL PARTS
                    </h1>
                )}
            </header>

            <main className="flex-grow-1">
                <Container fluid className="px-lg-5 my-4 mx-auto" style={{ maxWidth: '2000px' }}>
                    {/* RESTORED BRAND HUB HEADER */}
                    {currentBrand && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="brand-header-box mb-5 overflow-hidden shadow-2xl"
                            style={{ 
                                background: '#0B0E14', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: '2rem' 
                            }}
                        >
                            <Row className="g-0">
                                {/* Left Column: Brand Context & Model Chips */}
                                <Col lg={5} className="p-4 p-md-5 border-bottom border-lg-bottom-0 border-lg-end border-secondary d-flex flex-column justify-content-center position-relative">
                                    <div className="position-relative z-index-1">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="bg-info" style={{ height: '2px', width: '40px' }}></div>
                                            <span className="text-info text-uppercase fw-bold small letter-spacing-1">Hardware Repository</span>
                                        </div>
                                        <h1 className="display-4 fw-black text-white text-uppercase mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 900 }}>
                                            {currentBrand.name}
                                        </h1>

                                        <h6 className="text-secondary text-uppercase fw-bold small letter-spacing-1 mb-3 italic">Select Board Model</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                variant={!activeModelName ? "info" : "outline-light"}
                                                size="sm"
                                                className={`px-4 py-2 rounded-3 text-uppercase fw-bold small transition-all ${!activeModelName ? 'bg-info text-dark shadow-info' : 'text-light border-secondary opacity-50 hover-opacity-100'}`}
                                                onClick={() => setActiveFilters(prev => ({ ...prev, Model: undefined }))}
                                            >
                                                All Models
                                            </Button>
                                            {(groupedModels[currentBrand.name] || []).map(m => {
                                                const isActive = activeModelName === m.name;
                                                return (
                                                    <Button
                                                        key={`model-hub-${m.id}`}
                                                        variant={isActive ? "info" : "outline-light"}
                                                        size="sm"
                                                        className={`px-4 py-2 rounded-3 text-uppercase fw-bold small transition-all ${isActive ? 'bg-info text-dark shadow-info' : 'text-light border-secondary opacity-50 hover-opacity-100'}`}
                                                        onClick={() => handleModelToggle(m.name)}
                                                    >
                                                        {m.name}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </Col>

                                {/* Right Column: Featured Model / Brand Info */}
                                <Col lg={7} className="p-4 p-md-5 bg-dark bg-opacity-25">
                                    <Card className="featured-model-card h-100 border-0 p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(0,229,255,0.1)' }}>
                                        {featuredModel ? (
                                            <Row className="h-100 align-items-center g-4">
                                                <Col md={4} className="mb-4 mb-md-0">
                                                    <div className="bg-black rounded-4 border border-secondary p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                                                        {featuredModel.image_url ? (
                                                            <img src={featuredModel.image_url} alt={featuredModel.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                        ) : (
                                                            <div className="display-4 text-secondary opacity-10 italic fw-black text-center">X</div>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={8}>
                                                    <h3 className="text-white fw-black text-uppercase italic mb-4" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', fontWeight: 900 }}>{featuredModel.name}</h3>
                                                    <div>
                                                        <div className="text-info text-uppercase fw-bold small letter-spacing-1 mb-2" style={{ fontSize: '10px', opacity: 0.8 }}>Technical Readout</div>
                                                        <p className="text-light font-monospace mb-0" style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', opacity: 0.75 }}>
                                                            {featuredModel.description || "AWAITING ADMINISTRATIVE HARDWARE ENTRY."}
                                                        </p>
                                                    </div>
                                                </Col>
                                            </Row>
                                        ) : (
                                            <Row className="h-100 align-items-center g-4">
                                                <Col md={4} className="mb-4 mb-md-0">
                                                    <div className="bg-black rounded-4 border border-secondary p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                                                        {currentBrand.image_url ? (
                                                            <img src={currentBrand.image_url} alt={currentBrand.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                        ) : (
                                                            <div className="display-1 text-secondary opacity-10 italic fw-black text-center">i</div>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={8}>
                                                    <h2 className="text-white fw-black text-uppercase italic mb-1" style={{ fontSize: '2rem', letterSpacing: '-0.03em', fontWeight: 900 }}>{currentBrand.name}</h2>
                                                    <div className="text-info text-uppercase fw-bold small letter-spacing-1 mb-4" style={{ fontSize: '10px' }}>Hardware Repository</div>
                                                    <p className="text-light font-monospace mb-0" style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', opacity: 0.75 }}>
                                                        {currentBrand.description || "AWAITING ADMINISTRATIVE DOCUMENTATION SYNC FOR THIS HARDWARE PLATFORM."}
                                                    </p>
                                                </Col>
                                            </Row>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </motion.div>
                    )}

                    <Row>
                        {/* Sidebar Column */}
                        <Col lg={4} xl={4} xxl={3} className={`d-none d-lg-block sticky-top`} style={{ top: '80px', height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                            <div className="sidebar-container bg-dark p-3 rounded-4 border border-secondary shadow-lg">
                                <FilterSidebar 
                                    templates={fullAttributeTemplates} 
                                    activeFilters={activeFilters} 
                                    setActiveFilters={setActiveFilters} 
                                />
                            </div>
                        </Col>

                        {/* Mobile Filter Toggle */}
                        <div className="mobile-filter-bar d-lg-none fixed-bottom p-3 d-flex justify-content-center z-index-100" style={{ pointerEvents: 'none', marginBottom: '20px' }}>
                            <button 
                                className="btn mobile-filter-btn shadow-lg d-flex align-items-center gap-3 px-5 py-3 rounded-pill position-relative" 
                                style={{ pointerEvents: 'auto', backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#00E5FF' }}
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <FaFilter />
                                <span className="fw-bold uppercase letter-spacing-1">Filter Attributes</span>
                                {activeFilterCount > 0 && <RBABadge className="position-absolute top-0 start-100 translate-middle rounded-pill" style={{ background: '#10b981' }}>{activeFilterCount}</RBABadge>}
                            </button>
                        </div>

                        {/* Mobile Filters Drawer */}
                        <Offcanvas show={isMobileScreen && isSidebarOpen} onHide={() => setIsSidebarOpen(false)} data-bs-theme="dark" className="bg-dark border-top border-secondary h-75" placement="bottom">
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title className="uppercase text-info fw-black letter-spacing-1">Filters</Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body><FilterSidebar templates={fullAttributeTemplates} activeFilters={activeFilters} setActiveFilters={setActiveFilters} /></Offcanvas.Body>
                        </Offcanvas>

                        {/* Parts Grid Column */}
                        <Col lg={8} xl={8} xxl={9} className="px-3">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                                <div className="d-flex align-items-center">
                                    <motion.h4 key={filteredParts.length} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 0.75 }} className="m-0">
                                        {filteredParts.length} Results
                                    </motion.h4>
                                </div>
                                <InputGroup className="w-auto shadow-sm" style={{ maxWidth: '400px', flex: 1 }}>
                                    <InputGroup.Text className="bg-dark border-secondary text-info"><FaMagnifyingGlass /></InputGroup.Text>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Search by part title..." 
                                        className="bg-dark text-light border-secondary" 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                    />
                                    {(searchTerm || activeFilterCount > 0) && (
                                        <Button variant="outline-secondary" className="border-secondary text-muted" onClick={clearAllFilters}><FaArrowRotateLeft /></Button>
                                    )}
                                </InputGroup>
                            </div>

                            {isLoading ? (
                                <Row className="g-4 parts-grid">
                                    {[...Array(6)].map((_, i) => (
                                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2} className="mb-4 d-flex align-items-stretch" style={{ minWidth: '280px', flexShrink: 0 }} key={`skeleton-${i}`}>
                                            <SkeletonCard />
                                        </Col>
                                    ))}
                                </Row>
                            ) : filteredParts.length > 0 ? (
                                <Row className="g-4 parts-grid">
                                    <AnimatePresence mode="popLayout">
                                        {filteredParts.map(part => (
                                            <motion.div 
                                                layout 
                                                initial={{ opacity: 0, scale: 0.95 }} 
                                                animate={{ opacity: 1, scale: 1 }} 
                                                exit={{ opacity: 0, scale: 0.95 }} 
                                                key={`part-${part.id}`}
                                                className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl-2 mb-4 d-flex align-items-stretch"
                                                style={{ minWidth: '280px', flexShrink: 0 }}
                                            >
                                                <div className="w-100">
                                                    <PartCard part={mapPartToSchema(part)} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </Row>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-5 empty-state bg-dark rounded-4 border border-secondary mt-2 shadow mx-auto" style={{ maxWidth: '600px' }}>
                                    <LucideSearchX size={48} className="text-secondary opacity-50 mb-4" />
                                    <h3 className="uppercase opacity-50 mb-3 fw-bold">No results found</h3>
                                    <p className="text-muted mb-4 opacity-75 px-4">We couldn't find any parts matching your filters.</p>
                                    <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center">
                                        <button className="btn btn-info px-4 py-2 fw-bold rounded-pill text-dark" onClick={clearAllFilters}>Reset All Filters</button>
                                        <a href="mailto:support@esk8cad.com" className="btn btn-outline-secondary px-4 py-2 fw-bold rounded-pill text-light">Need help?</a>
                                    </div>
                                </motion.div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </main>
            <SiteFooter />

            <style dangerouslySetInnerHTML={{__html: `
                .sticky-top::-webkit-scrollbar { width: 4px; }
                .sticky-top::-webkit-scrollbar-thumb { background-color: #333; border-radius: 10px; }
                .sidebar-container { background-color: #0b0e14 !important; }
                .shadow-2xl { box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .shadow-info { box-shadow: 0 0 15px rgba(0, 229, 255, 0.3); }
                .letter-spacing-1 { letter-spacing: 0.1em; }
                .letter-spacing-2 { letter-spacing: 0.25em; }
            `}} />
        </div>
    )
}

export default CatalogPage;
