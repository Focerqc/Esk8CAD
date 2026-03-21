import React, { useState, useEffect, useMemo } from "react"
import { Container, Row, Col, Offcanvas, Form, InputGroup, Button } from "react-bootstrap"
import SiteNavbar from "../../components/SiteNavbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import PartCard from "../../components/PartCard"
import FilterSidebar from "../../components/FilterSidebar"
import { useParts, Part } from "../../util/parts"
import { AttributeTemplate, matchesFilters } from "../../util/filterUtils"
import { getSupabaseClient } from "../../lib/supabase"
import { useFilterUrlSync } from "../../hooks/useFilterUrlSync"
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6"
import "../../scss/pages/items.scss"

const CatalogPage: React.FC = () => {
    const { parts, isLoading } = useParts();
    const [attributeTemplates, setAttributeTemplates] = useState<AttributeTemplate[]>([]);
    
    // Page State
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    // Sync state with URL query parameters seamlessly
    useFilterUrlSync(activeFilters, searchTerm, setActiveFilters, setSearchTerm);

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

    // Fetch Attribute Templates (extract from part_categories)
    useEffect(() => {
        const fetchTemplates = async () => {
            const client = getSupabaseClient();
            if (!client) return;
            // Fetch categories to aggregate template_fields
            const { data, error } = await client.from('part_categories').select('template_fields');
            if (data && !error) {
                // Flatten and deduplicate by key
                const templatesMap = new Map<string, AttributeTemplate>();
                data.forEach((cat: any) => {
                    if (cat.template_fields && Array.isArray(cat.template_fields)) {
                        cat.template_fields.forEach((tf: AttributeTemplate) => {
                            if (!templatesMap.has(tf.key)) {
                                templatesMap.set(tf.key, tf);
                            }
                        });
                    }
                });
                setAttributeTemplates(Array.from(templatesMap.values()));
            }
        };
        fetchTemplates();
    }, []);

    // Mix in Brand and Category as dynamic filter templates based on fetched parts
    const fullAttributeTemplates = useMemo(() => {
        const brandOptions = Array.from(new Set(parts.map(p => p.brands?.name).filter(Boolean))) as string[];
        const categoryOptions = Array.from(new Set(parts.map(p => p.part_categories?.name).filter(Boolean))) as string[];

        const rootTemplates: AttributeTemplate[] = [
            { key: 'Brand', type: 'array', options: brandOptions.sort() },
            { key: 'Category', type: 'array', options: categoryOptions.sort() }
        ];

        return [...rootTemplates, ...attributeTemplates];
    }, [parts, attributeTemplates]);

    // Data Integration: Filter parts
    const filteredParts = useMemo(() => {
        return parts.filter((part) => {
            // Text Search matching
            const matchesText = searchTerm.trim() === '' || 
                (part.title?.toLowerCase().includes(searchTerm.toLowerCase().trim()));
            if (!matchesText) return false;
            
            // Attribute Filters Engine
            return matchesFilters(part, activeFilters);
        });
    }, [parts, activeFilters, searchTerm]);

    const clearAllFilters = () => {
        setActiveFilters({});
        setSearchTerm('');
    };

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-0 page-items">
            <SiteMetaData title="Catalog | ESK8CAD.COM" />
            <header>
                <SiteNavbar />
                <h1 className="flex-center uppercase letter-spacing-2 mt-5 mb-0" style={{ fontWeight: 900 }}>ALL PARTS</h1>
            </header>

            <main className="flex-grow-1">
                <Container fluid className="px-lg-5 my-4">
                    <Row>
                        {/* Sidebar Column */}
                        <Col lg={3} xl={2} className={`d-none d-lg-block sticky-top`} style={{ top: '80px', height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                            <div className="sidebar-container bg-dark p-3 rounded-4 border border-secondary shadow-lg">
                                <FilterSidebar 
                                    templates={fullAttributeTemplates} 
                                    activeFilters={activeFilters} 
                                    setActiveFilters={setActiveFilters} 
                                />
                            </div>
                        </Col>

                        {/* Mobile Sidebar (Offcanvas) */}
                        <div className="d-lg-none w-100 d-flex justify-content-end mb-3 px-3">
                            <button className="btn btn-outline-info w-100 fw-bold uppercase px-4 d-flex justify-content-between align-items-center" onClick={() => setIsSidebarOpen(true)}>
                                <span>Filter Attributes</span>
                                <span className="badge bg-info text-dark rounded-pill">{Object.keys(activeFilters).length || ''}</span>
                            </button>
                        </div>
                        <Offcanvas show={isMobileScreen && isSidebarOpen} onHide={() => setIsSidebarOpen(false)} data-bs-theme="dark" className="bg-dark border-end border-secondary">
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title className="uppercase text-info fw-bold">Filters</Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body>
                                <FilterSidebar 
                                    templates={fullAttributeTemplates} 
                                    activeFilters={activeFilters} 
                                    setActiveFilters={setActiveFilters} 
                                />
                            </Offcanvas.Body>
                        </Offcanvas>

                        {/* Parts Grid Column */}
                        <Col lg={9} xl={10} className="px-3">
                            
                            {/* Toolbar (Search & Results Count) */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                                <h4 className="m-0 opacity-75">{filteredParts.length} Results</h4>
                                
                                <InputGroup className="w-auto shadow-sm" style={{ maxWidth: '400px', flex: 1 }}>
                                    <InputGroup.Text className="bg-dark border-secondary text-info">
                                        <FaMagnifyingGlass />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by part title..."
                                        className="bg-dark text-light border-secondary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ boxShadow: 'none' }}
                                    />
                                    {searchTerm && (
                                        <Button variant="outline-secondary" className="border-secondary text-muted hover-text-light" onClick={() => setSearchTerm('')}>
                                            <FaXmark />
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>

                            {isLoading ? (
                                <div className="d-flex justify-content-center my-5">
                                    <div className="spinner-border text-info" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : filteredParts.length > 0 ? (
                                <div className="parts-catalog-grid">
                                    {filteredParts.map(part => (
                                        <div key={part.id} className="parts-catalog-grid-item mb-4">
                                            <PartCard part={{
                                                ...part,
                                                id: String(part.id),
                                                image_url: part.image_src || '',
                                                boardPlatform: part.brands?.name || 'Unknown',
                                                tags: part.type_of_part || [],
                                                externalUrl: part.external_url || undefined,
                                                dropboxUrl: part.dropbox_url || undefined,
                                            } as any} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 empty-state bg-dark rounded-4 border border-secondary mt-2 shadow mx-auto" style={{ maxWidth: '600px' }}>
                                    <h3 className="uppercase tracking-wide opacity-50 mb-3">No results found</h3>
                                    <p className="text-muted mb-4 opacity-75 px-4">Try relaxing your filter parameters or search query to discover more parts.</p>
                                    <button className="btn btn-info px-4 py-3 fw-bold rounded-pill text-dark hover-opacity-100" onClick={clearAllFilters}>
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </main>
            <SiteFooter />

            <style dangerouslySetInnerHTML={{__html: `
                .parts-catalog-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 768px) {
                    .parts-catalog-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 1200px) {
                    .parts-catalog-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (min-width: 1600px) {
                    .parts-catalog-grid { grid-template-columns: repeat(4, 1fr); }
                }
                .sticky-top::-webkit-scrollbar {
                    width: 4px;
                }
                .sticky-top::-webkit-scrollbar-thumb {
                    background-color: #333;
                    border-radius: 10px;
                }
                .sidebar-container {
                    background-color: #0b0e14 !important;
                }
            `}} />
        </div>
    )
}

export default CatalogPage;
