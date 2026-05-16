import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Card, Badge, Nav, Table, Spinner, Form } from 'react-bootstrap';
import SiteNavbar from '../components/SiteNavbar';
import SiteFooter from '../components/SiteFooter';
import SiteMetaData from '../components/SiteMetaData';
import { getSupabaseClient } from '../lib/supabase';
import { useBoardHook } from '../hooks/useBoardHook';
import { useForm, useFieldArray } from 'react-hook-form';
import { PartFormItem, Taxonomy } from './submit';

const TestSubmitForm: React.FC = () => {
    const [view, setView] = useState<'submit' | 'admin' | 'brands' | 'categories'>('submit');
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > 1400);
    const [supabase] = useState(() => getSupabaseClient());
    
    const { brands, models, loading: isBoardLoading } = useBoardHook();
    const [categories, setCategories] = useState<Taxonomy[]>([]);
    const [fabricationMethods, setFabricationMethods] = useState<Taxonomy[]>([]);
    const [parts, setParts] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dimensionUnits, setDimensionUnits] = useState<Record<string, 'in' | 'mm' | 'cm'>>({});
    const [dimensionTypes, setDimensionTypes] = useState<Record<string, 'text' | 'dimension'>>({});

    // React Hook Form for Sandbox
    const { control, watch, setValue, reset } = useForm({
        defaultValues: {
            parts: [{
                title: '',
                url: '',
                imageSrc: '',
                isOem: false,
                platformId: '',
                categoryId: '',
                fabricationMethodId: '',
                author: '',
                submittedBy: '',
                attributes: {},
                modelId: null,
                needsModelReview: false
            }]
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "parts"
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            const { data: catData } = await supabase.from('part_categories').select('*').order('name');
            setCategories(catData || []);

            const { data: fabData } = await supabase.from('fabrication_methods').select('*').order('name');
            setFabricationMethods(fabData || []);
            
            const { data: partData } = await supabase.from('parts').select('id, category_id, attributes');
            setParts(partData || []);
            setIsLoadingData(false);
        };
        fetchData();
    }, [supabase]);

    // Dummy data for "Admin Edit" mode
    const loadDummyData = () => {
        // Find a category that looks like a plate or bracket
        const plateCat = categories.find(c => c.name.toLowerCase().includes('plate') || c.name.toLowerCase().includes('antisink')) || categories[0];
        
        // Find a model that belongs to the selected brand if possible
        const streetBrand = brands.find(b => b.name === "Street (DIY/Generic)");
        const matchingModel = models.find(m => m.brand_id === streetBrand?.id) || models[0];

        const dummyPart = {
            title: "Pro-Series CNC Antisink Plate",
            url: "https://www.printables.com/model/123456-pro-antisink-plate",
            imageSrc: "https://images.turo.com/rf/789.jpg",
            isOem: false,
            platformId: streetBrand?.id || brands[0]?.id,
            categoryId: plateCat?.id,
            fabricationMethodId: fabricationMethods.find(f => f.name.toLowerCase().includes('cnc'))?.id || fabricationMethods[0]?.id,
            author: 'CNC_Master',
            submittedBy: 'Admin',
            attributes: {
                "Bolt Pattern": "New School (Standard)",
                "Thickness": "4.5",
                "Material": "Aluminum 6061-T6",
                "Finish": "Anodized Black"
            },
            modelId: matchingModel?.id || null,
            needsModelReview: false
        };

        reset({
            parts: [dummyPart]
        });
        
        // Also inject some custom attributes to show how it looks
        setDimensionUnits({
            "Thickness": "mm"
        });
        setDimensionTypes({
            "Thickness": "dimension"
        });
    };

    useEffect(() => {
        if (view === 'admin' && brands.length > 0 && categories.length > 0) {
            loadDummyData();
        } else if (view === 'submit') {
            reset({
                parts: [{
                    title: '',
                    url: '',
                    imageSrc: '',
                    isOem: false,
                    platformId: '',
                    categoryId: '',
                    fabricationMethodId: '',
                    author: '',
                    submittedBy: '',
                    attributes: {},
                    modelId: null,
                    needsModelReview: false
                }]
            });
        }
    }, [view, brands, categories]);

    const attributeStats = useMemo(() => {
        const stats: Record<string, number> = {};
        parts.forEach(p => {
            if (p.attributes) {
                Object.keys(p.attributes).forEach(k => {
                    if (!k.endsWith('__unit')) {
                        stats[k] = (stats[k] || 0) + 1;
                    }
                });
            }
        });
        return stats;
    }, [parts]);

    return (
        <div className="bg-black text-light min-vh-100">
            <SiteMetaData title="ESK8CAD / Form Lab" />
            <SiteNavbar />
            
            <Container fluid className="py-4 px-lg-5">
                <header className="mb-4 d-flex justify-content-between align-items-center border-bottom border-secondary pb-3">
                    <div>
                        <h1 className="h3 mb-0 text-info fw-black uppercase">Form Lab & Taxonomy Explorer</h1>
                        <p className="small text-muted mb-0">Debug and optimize submission/edit flows</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2 bg-dark px-3 py-2 rounded border border-secondary border-opacity-25">
                            <span className="extreme-small fw-bold text-muted uppercase">Layout Mode</span>
                            <Form.Check 
                                type="switch"
                                id="landscape-switch"
                                label={isLandscape ? "Landscape (Desktop)" : "Vertical (Mobile)"}
                                checked={isLandscape}
                                onChange={() => setIsLandscape(!isLandscape)}
                                className="text-info extreme-small fw-bold uppercase"
                            />
                        </div>
                        <Button variant="outline-danger" size="sm" className="extreme-small fw-bold" onClick={() => window.location.reload()}>REFRESH REPOSITORY</Button>
                    </div>
                </header>

                <Nav variant="pills" className="bg-dark p-2 rounded border border-secondary border-opacity-25 gap-2 mb-4 shadow-sm">
                    <Nav.Item>
                        <Nav.Link active={view === 'submit'} onClick={() => { setView('submit'); reset({ parts: [{ title: '', url: '', imageSrc: '', isOem: false, platformId: '', categoryId: '', fabricationMethodId: '', author: '', submittedBy: '', attributes: {}, modelId: null, needsModelReview: false }] }); }} className="fw-bold uppercase small px-4">1. Submit Form (Blank)</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'admin'} onClick={() => { setView('admin'); loadDummyData(); }} className="fw-bold uppercase small px-4">2. Admin Edit (Pre-filled)</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'brands'} onClick={() => setView('brands')} className="extreme-small fw-bold uppercase">3. Brands & Models</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'categories'} onClick={() => setView('categories')} className="extreme-small fw-bold uppercase">4. Categories & Attrs</Nav.Link>
                    </Nav.Item>
                </Nav>

                <div className="form-lab-content">
                    {(view === 'submit' || view === 'admin') && (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <div className="mb-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="text-white mb-1 fw-bold uppercase letter-spacing-1">{view === 'submit' ? 'Community Submission Form' : 'Admin Asset Editor'}</h4>
                                    <p className="text-muted small mb-0">{view === 'submit' ? 'Testing fresh entry validation and auto-scraping.' : 'Testing existing data population and taxonomy overrides.'}</p>
                                </div>
                                <Badge bg={view === 'submit' ? 'info' : 'warning'} text="dark" className="p-2 px-3 fw-bold uppercase">{view} mode</Badge>
                            </div>

                            <div className={isLandscape ? "px-lg-5 mx-auto" : ""} style={isLandscape ? { maxWidth: '1600px' } : {}}>
                                {fields.map((field, index) => (
                                    <PartFormItem
                                        key={field.id}
                                        index={index}
                                        control={control}
                                        remove={() => {}}
                                        canRemove={false}
                                        watch={watch}
                                        setValue={setValue}
                                        platforms={brands}
                                        categories={categories}
                                        fabricationMethods={fabricationMethods}
                                        dimensionUnits={dimensionUnits}
                                        setDimensionUnits={setDimensionUnits}
                                        dimensionTypes={dimensionTypes}
                                        setDimensionTypes={setDimensionTypes}
                                        isLandscape={isLandscape}
                                    />
                                ))}
                            </div>

                            <div className="mt-5 pt-4 border-top border-secondary border-opacity-25 d-flex justify-content-end gap-3 pb-5">
                                <Button variant="outline-secondary" className="fw-bold px-4" onClick={() => reset()}>Reset Sandbox</Button>
                                <Button variant={view === 'submit' ? 'info' : 'success'} className="fw-bold px-5 py-2 shadow-sm" onClick={() => alert("Simulation: Changes Saved Successfully")}>
                                    {view === 'submit' ? 'SUBMIT NEW PART' : 'SAVE REGISTRY EDITS'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <style dangerouslySetInnerHTML={{ __html: `
                        .animate-in { animation: animate-in 0.5s ease-out; }
                        @keyframes animate-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                        .form-lab-content .card { border-radius: 20px; overflow: hidden; }
                        .form-lab-content .input-contrast { background: #000 !important; color: #fff !important; }
                        .form-lab-content .extreme-small { font-size: 0.65rem; }
                        .form-lab-content .letter-spacing-1 { letter-spacing: 0.1em; }
                        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.5) !important; }
                    `}} />

                    {view === 'brands' && (
                        <div className="row g-4">
                            <div className="col-lg-12">
                                <Card className="bg-dark border-secondary shadow-sm">
                                    <Card.Header className="bg-secondary bg-opacity-25 border-bottom border-secondary p-3">
                                        <h5 className="mb-0 small fw-bold uppercase letter-spacing-1">Hardware Brand Registry</h5>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        {isBoardLoading ? (
                                            <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table variant="dark" hover className="mb-0 align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th className="ps-4 extreme-small uppercase opacity-50 py-3">Brand Name</th>
                                                            <th className="extreme-small uppercase opacity-50 py-3">Models</th>
                                                            <th className="extreme-small uppercase opacity-50 py-3 text-center">Parts</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {brands.map(brand => {
                                                            const brandModels = models.filter(m => m.brand_id === brand.id);
                                                            return (
                                                                <tr key={brand.id}>
                                                                    <td className="ps-4 fw-bold text-info py-3">{brand.name}</td>
                                                                    <td className="py-3">
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {brandModels.length > 0 ? (
                                                                                brandModels.map(m => <Badge key={m.id} bg="secondary" className="extreme-small opacity-75">{m.name}</Badge>)
                                                                            ) : (
                                                                                <span className="extreme-small italic opacity-25">No models registered</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center py-3">
                                                                        <Badge bg="dark" className="border border-secondary">?</Badge>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>
                    )}

                    {view === 'categories' && (
                        <div className="row g-4">
                            <div className="col-lg-7">
                                <Card className="bg-dark border-secondary h-100 shadow-sm">
                                    <Card.Header className="bg-secondary bg-opacity-25 border-bottom border-secondary p-3">
                                        <h5 className="mb-0 small fw-bold uppercase letter-spacing-1">Part Categories & Template Fields</h5>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        {isLoadingData ? (
                                            <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                                        ) : (
                                            <div className="accordion accordion-flush" id="catAccordion">
                                                {categories.map((cat, idx) => (
                                                    <div key={cat.id} className="accordion-item bg-transparent border-bottom border-secondary border-opacity-25">
                                                        <h2 className="accordion-header">
                                                            <button className="accordion-button bg-transparent text-white collapsed py-3" type="button" data-bs-toggle="collapse" data-bs-target={`#cat${idx}`}>
                                                                <span className="fw-bold me-2">{cat.name}</span>
                                                                <Badge bg="info" className="extreme-small">{cat.template_fields?.length || 0} Fields</Badge>
                                                            </button>
                                                        </h2>
                                                        <div id={`cat${idx}`} className="accordion-collapse collapse" data-bs-parent="#catAccordion">
                                                            <div className="accordion-body bg-black bg-opacity-25">
                                                                <div className="d-flex flex-column gap-2">
                                                                    {cat.template_fields?.map((f: any) => (
                                                                        <div key={f.key} className="d-flex justify-content-between align-items-center p-2 bg-dark rounded border border-secondary border-opacity-25">
                                                                            <div>
                                                                                <div className="fw-bold small">{f.key}</div>
                                                                                <div className="extreme-small text-muted">{f.type} {f.unit ? `(${f.unit})` : ''}</div>
                                                                            </div>
                                                                            {f.diagram_url && <Badge bg="success" className="extreme-small">DIAGRAM</Badge>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </div>
                            <div className="col-lg-5">
                                <Card className="bg-dark border-secondary h-100 shadow-sm">
                                    <Card.Header className="bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25 p-3">
                                        <h5 className="mb-0 small fw-bold uppercase letter-spacing-1 text-warning">Global Attribute Discovered Keys</h5>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <div className="table-responsive" style={{ maxHeight: '600px' }}>
                                            <Table variant="dark" hover className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th className="ps-3 extreme-small uppercase opacity-50 py-3">Discovered Key</th>
                                                        <th className="extreme-small uppercase opacity-50 py-3 text-center">Usage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(attributeStats).sort((a,b) => b[1] - a[1]).map(([key, count]) => (
                                                        <tr key={key}>
                                                            <td className="ps-3 font-monospace small py-2">{key}</td>
                                                            <td className="text-center py-2"><Badge bg="secondary">{count}</Badge></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </Container>

            <SiteFooter />
        </div>
    );
};

export default TestSubmitForm;
