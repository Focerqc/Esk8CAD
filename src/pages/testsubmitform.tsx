import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Card, Badge, Nav, Table, Spinner, Form } from 'react-bootstrap';
import SiteNavbar from '../components/SiteNavbar';
import SiteFooter from '../components/SiteFooter';
import SiteMetaData from '../components/SiteMetaData';
import { getSupabaseClient } from '../lib/supabase';
import { useBoardHook } from '../hooks/useBoardHook';

const TestSubmitForm: React.FC = () => {
    const [view, setView] = useState<'submit' | 'admin' | 'brands' | 'categories'>('brands');
    const [isLandscape, setIsLandscape] = useState(true);
    const [supabase] = useState(() => getSupabaseClient());
    
    const { brands, models, loading: isBoardLoading } = useBoardHook();
    const [categories, setCategories] = useState<any[]>([]);
    const [parts, setParts] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            const { data: catData } = await supabase.from('part_categories').select('*').order('name');
            setCategories(catData || []);
            
            const { data: partData } = await supabase.from('parts').select('id, category_id, attributes');
            setParts(partData || []);
            setIsLoadingData(false);
        };
        fetchData();
    }, [supabase]);

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
                    <div className="d-flex gap-2">
                        <Button variant="outline-danger" size="sm" className="extreme-small fw-bold" onClick={() => window.location.reload()}>REFRESH REPOSITORY</Button>
                    </div>
                </header>

                <Nav variant="pills" className="mb-4 gap-2 bg-dark p-2 rounded shadow-sm border border-secondary border-opacity-10">
                    <Nav.Item>
                        <Nav.Link active={view === 'submit'} onClick={() => setView('submit')} className="extreme-small fw-bold uppercase">1. Submit Form</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'admin'} onClick={() => setView('admin')} className="extreme-small fw-bold uppercase">2. Admin Edit</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'brands'} onClick={() => setView('brands')} className="extreme-small fw-bold uppercase">3. Brands & Models</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={view === 'categories'} onClick={() => setView('categories')} className="extreme-small fw-bold uppercase">4. Categories & Attrs</Nav.Link>
                    </Nav.Item>
                </Nav>

                <div className="form-lab-content">
                    {view === 'submit' && (
                        <div className="text-center py-5">
                            <h4 className="text-white mb-3 fw-bold">Submit Form Sandbox</h4>
                            <p className="text-muted mb-4">The new landscape submission interface is live.</p>
                            <Button href="/submit" variant="info" className="fw-bold px-5 py-3">OPEN SUBMIT FORM</Button>
                        </div>
                    )}

                    {view === 'admin' && (
                        <div className="text-center py-5">
                            <h4 className="text-white mb-3 fw-bold">Admin Editor Sandbox</h4>
                            <p className="text-muted mb-4">Registry management tools with landscape support.</p>
                            <Button href="/admin" variant="warning" className="fw-bold px-5 py-3">OPEN ADMIN DASHBOARD</Button>
                        </div>
                    )}

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
