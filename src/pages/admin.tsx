import { type PageProps } from "gatsby"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Alert, Spinner, Tabs, Tab, Row, Col, Badge, Stack, InputGroup, Modal } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import { getSupabaseClient, Part } from "../lib/supabase"
import { SupabaseClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js"

const GlobalStyles = () => (
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
);

interface Taxonomy {
    id: string;
    name: string;
}

const AdminPartCard = ({ part, actions, onEdit }: { part: Part, actions: React.ReactNode, onEdit: () => void }) => {
    // secure imgSrc
    const imgSrc = Array.isArray(part.image_src) ? part.image_src[0] : part.image_src;
    const author = part.author || part.submitted_by || "Unknown";
    const [imgError, setImgError] = useState(false);

    return (
        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4 d-flex align-items-stretch" style={{ minWidth: '280px', flexShrink: 0 }}>
            <div className="w-100 h-100 position-relative z-index-0">
                <Card className="h-100 shadow-sm border-secondary db-card bg-dark text-light overflow-hidden">
                    <div className="card-img-holder position-relative overflow-hidden" style={{ aspectRatio: "16 / 9", height: "auto", width: "100%", backgroundColor: "#1a1d20" }}>
                        {!imgError && imgSrc ? (
                            <img src={imgSrc} alt={part.title} loading="lazy" style={{ objectFit: 'cover', width: '100%', height: '100%', borderTopLeftRadius: 'var(--bs-card-inner-border-radius)', borderTopRightRadius: 'var(--bs-card-inner-border-radius)' }} onError={() => setImgError(true)} />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted placeholder-glow text-center p-3" style={{ borderTopLeftRadius: 'var(--bs-card-inner-border-radius)', borderTopRightRadius: 'var(--bs-card-inner-border-radius)' }}>
                                <div className="placeholder w-100 h-100 bg-secondary" style={{ opacity: 0.2 }}></div>
                                <span className="position-absolute z-index-1">No Image Available</span>
                            </div>
                        )}
                        <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                            <Badge bg="primary" className="shadow-sm py-2 px-3 border border-dark">
                                #{part.id?.toString().substring(0, 5)}
                            </Badge>
                        </div>
                    </div>
                    <Card.Body className="d-flex flex-column pt-3 px-3 pb-3">
                        <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
                            <Card.Title as="h5" className="mb-1 fw-bold text-white text-truncate" title={part.title} style={{ minWidth: 0 }}>{part.title}</Card.Title>
                            <Button variant="outline-light" size="sm" className="px-2 py-0 flex-shrink-0" onClick={onEdit} style={{ fontSize: '0.8rem' }}>Edit</Button>
                        </div>
                        <Card.Subtitle className="mb-3 text-muted small">
                            By: <span className="text-light">{author}</span>
                        </Card.Subtitle>

                        <div className="mb-3">
                            <span className="text-info fw-bold small me-2 d-block mb-2 text-uppercase letter-spacing-1">{part.platform?.join(', ') || "No Platform"}</span>
                            <div className="d-flex flex-wrap gap-1">
                                {part.type_of_part?.map((tag, i) => (
                                    <Badge key={`cat-${i}`} pill bg="secondary" className="border border-secondary py-1 px-2 text-truncate" style={{ maxWidth: '150px' }}>{tag}</Badge>
                                ))}
                                {part.fabrication_method?.map((tag, i) => (
                                    <Badge key={`fab-${i}`} pill bg="dark" className="border border-secondary py-1 px-2 text-truncate" style={{ maxWidth: '150px' }}>{tag}</Badge>
                                ))}
                                {part.is_oem && <Badge pill bg="none" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }} className="border py-1 px-2">OEM</Badge>}
                            </div>
                        </div>

                        <div className="mt-auto pt-3 border-top border-secondary">
                            {part.external_url ? (
                                <a href={part.external_url} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm w-100 fw-bold m-0 position-relative z-index-1 mb-2">
                                    External Listing
                                </a>
                            ) : (
                                <button className="btn btn-outline-secondary btn-sm w-100 fw-bold m-0 disabled border-0 mb-2" aria-disabled="true">
                                    No External Link
                                </button>
                            )}
                            {part.dropbox_url && (
                                <a href={part.dropbox_url} target="_blank" rel="noreferrer" className="btn btn-outline-success btn-sm w-100 fw-bold m-0 position-relative z-index-1 mb-2">
                                    Mirror
                                </a>
                            )}
                            <Stack direction="horizontal" gap={2} className="w-100 justify-content-between">
                                {actions}
                            </Stack>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Col>
    );
};

export default function AdminPage(props: PageProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    const [parts, setParts] = useState<Part[]>([]);
    const [partCategories, setPartCategories] = useState<Taxonomy[]>([]);
    const [boardPlatforms, setBoardPlatforms] = useState<Taxonomy[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [newPlatform, setNewPlatform] = useState("");

    const [selectedCategory, setSelectedCategory] = useState<Taxonomy | null>(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState(false);

    const [selectedPlatform, setSelectedPlatform] = useState<Taxonomy | null>(null);
    const [editPlatformName, setEditPlatformName] = useState("");
    const [platformDeleteConfirm, setPlatformDeleteConfirm] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleSaveEdit = async () => {
        if (!supabase || !editingPart || !editingPart.id) return;
        setIsSavingEdit(true);
        try {
            const payload = {
                title: editingPart.title || 'Untitled',
                external_url: editingPart.external_url || '',
                image_src: editingPart.image_src || '',
                author: editingPart.author || undefined,
                submitted_by: editingPart.submitted_by || 'Anonymous',
                platform: editingPart.platform || [],
                type_of_part: editingPart.type_of_part || [],
                fabrication_method: editingPart.fabrication_method || [],
                is_oem: editingPart.is_oem || false,
                dropbox_url: editingPart.dropbox_url || undefined,
            };
            const { error: sbError } = await supabase.from('parts').update(payload).eq('id', editingPart.id);
            if (sbError) throw sbError;
            setParts(prev => prev.map(p => p.id === editingPart.id ? { ...p, ...payload } : p));
            setEditingPart(null);
        } catch (err: any) {
            setError('Failed to save edits: ' + (err.message || String(err)));
        } finally {
            setIsSavingEdit(false);
        }
    };

    const toggleArray = (field: keyof Part, value: string, current: string[], isSingle = false) => {
        if (current.includes(value)) {
            setEditingPart(prev => ({ ...prev!, [field]: isSingle ? [] : current.filter(v => v !== value) }));
        } else {
            setEditingPart(prev => ({ ...prev!, [field]: isSingle ? [value] : [...current, value] }));
        }
    };

    // Filtered lists
    const pendingParts = parts.filter(p => p.status === 'pending');
    const approvedParts = parts.filter(p => p.status === 'approved');

    // Registry audit duplicate lookup
    const duplicates = useMemo(() => {
        const urlMap = new Map<string, Part[]>();
        parts.forEach(p => {
            if (!p.external_url) return;
            const normalized = p.external_url.trim().toLowerCase();
            if (!urlMap.has(normalized)) urlMap.set(normalized, []);
            urlMap.get(normalized)!.push(p);
        });
        return Array.from(urlMap.values()).filter(group => group.length > 1);
    }, [parts]);

    // Initial mount and client library check
    useEffect(() => {
        setIsMounted(true);
        const client = getSupabaseClient();
        setSupabase(client);
    }, []);

    useEffect(() => {
        if (!isMounted || !supabase) {
            if (isMounted && !supabase) setIsAuthChecking(false);
            return;
        }

        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    // Admin access via env var (never hardcode emails)
                    const adminEmail = process.env.GATSBY_ADMIN_EMAIL;
                    if (!adminEmail) {
                        if (process.env.NODE_ENV === 'development') console.warn("GATSBY_ADMIN_EMAIL is missing from environment. Admin access disabled.");
                    } else if (session?.user && session.user.email === adminEmail) {
                        setUser(session.user);
                    }
                }
            } catch (err) {
                console.error("Session check error", err);
            } finally {
                if (mounted) setIsAuthChecking(false);
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            if (mounted) {
                // Admin access via env var (never hardcode emails)
                const adminEmail = process.env.GATSBY_ADMIN_EMAIL;
                if (!adminEmail) {
                    if (process.env.NODE_ENV === 'development') console.warn("GATSBY_ADMIN_EMAIL is missing from environment. Admin access disabled.");
                    setUser(null);
                } else if (session?.user && session.user.email === adminEmail) {
                    setUser(session.user);
                } else {
                    setUser(null);
                }
            }
        });

        return () => {
            mounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [isMounted, supabase]);

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data: pData, error: pError } = await supabase.from('parts').select('*').order('created_at', { ascending: false });
            if (pError) throw pError;
            setParts((pData as Part[]) || []);

            const { data: cData } = await supabase.from('part_categories').select('*').order('name');
            if (cData) setPartCategories(cData);

            const { data: bData } = await supabase.from('board_platforms').select('*').order('name');
            if (bData) setBoardPlatforms(bData);
        } catch (err: any) {
            setError(err.message || 'Error fetching data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) {
            setLoginError("Supabase configuration missing.");
            return;
        }

        setIsLoginLoading(true);
        setLoginError(null);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            // Admin access via env var (never hardcode emails)
            const adminEmail = process.env.GATSBY_ADMIN_EMAIL;
            if (!adminEmail) {
                if (process.env.NODE_ENV === 'development') console.warn("GATSBY_ADMIN_EMAIL is missing from environment. Admin access disabled.");
                throw new Error("Admin email configuration missing on server.");
            }
            if (data?.session?.user?.email !== adminEmail) throw new Error("Unauthorized access. Admin privileges required.");
        } catch (err: any) {
            setLoginError(err.message || 'Login failed.');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    // --- ACTION HANDLERS ---
    const handleApprove = async (id: string) => {
        if (!supabase) return;
        try {
            const { error: sbError } = await supabase.from('parts').update({ status: 'approved' }).eq('id', id);
            if (sbError) throw sbError;
            setParts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
        } catch (err: any) {
            setError('Failed to approve: ' + (err.message || String(err)));
        }
    };

    const handleDeletePart = async (id: string, isRevoke = false) => {
        if (!supabase) return;
        if (!window.confirm(`Are you sure you want to ${isRevoke ? 'revoke and delete' : 'delete'} this part?`)) return;

        try {
            const { error: sbError } = await supabase.from('parts').delete().eq('id', id);
            if (sbError) throw sbError;
            setParts(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError('Failed to delete: ' + (err.message || String(err)));
        }
    };

    // --- TAXONOMY HANDLERS ---
    const handleAddCategory = async () => {
        if (!newCategory.trim() || !supabase) return;
        try {
            const { data, error: sbError } = await supabase.from('part_categories').insert([{ name: newCategory.trim() }]).select();
            if (sbError) throw sbError;
            if (data && data.length) {
                setPartCategories(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCategory('');
            }
        } catch (err: any) {
            setError('Failed to add category: ' + (err.message || String(err)));
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory || !editCategoryName.trim() || !supabase) return;
        try {
            const { error: sbError } = await supabase.from('part_categories').update({ name: editCategoryName.trim() }).eq('id', selectedCategory.id);
            if (sbError) throw sbError;
            setPartCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, name: editCategoryName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedCategory(null);
            setEditCategoryName("");
        } catch (err: any) {
            setError('Failed to update category: ' + (err.message || String(err)));
        }
    };

    const handleConfirmDeleteCategory = async () => {
        if (!selectedCategory || !supabase) return;
        try {
            const id = selectedCategory.id;
            const { error: sbError } = await supabase.from('part_categories').delete().eq('id', id);
            if (sbError) throw sbError;
            setPartCategories(prev => prev.filter(c => c.id !== id));
            setSelectedCategory(null);
            setCategoryDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete category: ' + (err.message || String(err)));
            fetchData();
        }
    };

    const handleAddPlatform = async () => {
        if (!newPlatform.trim() || !supabase) return;
        try {
            const { data, error: sbError } = await supabase.from('board_platforms').insert([{ name: newPlatform.trim() }]).select();
            if (sbError) throw sbError;
            if (data && data.length) {
                setBoardPlatforms(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
                setNewPlatform('');
            }
        } catch (err: any) {
            setError('Failed to add platform: ' + (err.message || String(err)));
        }
    };

    const handleUpdatePlatform = async () => {
        if (!selectedPlatform || !editPlatformName.trim() || !supabase) return;
        try {
            const { error: sbError } = await supabase.from('board_platforms').update({ name: editPlatformName.trim() }).eq('id', selectedPlatform.id);
            if (sbError) throw sbError;
            setBoardPlatforms(prev => prev.map(c => c.id === selectedPlatform.id ? { ...c, name: editPlatformName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedPlatform(null);
            setEditPlatformName("");
        } catch (err: any) {
            setError('Failed to update platform: ' + (err.message || String(err)));
        }
    };

    const handleConfirmDeletePlatform = async () => {
        if (!selectedPlatform || !supabase) return;
        try {
            const id = selectedPlatform.id;
            const { error: sbError } = await supabase.from('board_platforms').delete().eq('id', id);
            if (sbError) throw sbError;
            setBoardPlatforms(prev => prev.filter(c => c.id !== id));
            setSelectedPlatform(null);
            setPlatformDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete platform: ' + (err.message || String(err)));
            fetchData();
        }
    };

    // Prevent hydration flicker by only showing heavy UI components after mount
    if (!isMounted) return null;

    if (!supabase) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
                <GlobalStyles />
                <SiteNavbar />
                <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Alert variant="danger" className="text-center shadow-lg p-5 w-100" style={{ maxWidth: '600px' }}>
                        <h4 className="fw-bold mb-3">System Configuration Error</h4>
                        <p className="mb-0">
                            The Supabase connection could not be established. Ensure `GATSBY_SUPABASE_URL` and `GATSBY_SUPABASE_ANON_KEY` are provided.
                        </p>
                    </Alert>
                </Container>
                <SiteFooter />
            </div>
        );
    }

    if (isAuthChecking) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
                <GlobalStyles />
                <SiteNavbar />
                <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="info" />
                </Container>
                <SiteFooter />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
                <GlobalStyles />
                <SiteNavbar />
                <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Card className="bg-dark text-white border-secondary shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
                        <Card.Body>
                            <h3 className="text-center fw-bold mb-4">Login Required</h3>
                            <Alert variant="info" className="small">Please login with authorized admin credentials.</Alert>
                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black text-white border-secondary" required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-black text-white border-secondary" required />
                                </Form.Group>
                                {loginError && <Alert variant="danger" className="py-2 small border-0 bg-danger text-white">{loginError}</Alert>}
                                <Button variant="primary" type="submit" className="w-100 fw-bold shadow mt-3" disabled={isLoginLoading}>
                                    {isLoginLoading ? <Spinner size="sm" animation="border" /> : "Sign In"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Container>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <GlobalStyles />
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; } 
                .border-secondary { border-color: #24282d !important; } 
                .input-contrast { background-color: #2b3035 !important; border-color: #495057 !important; color: #fff !important; } 
                .admin-tabs .nav-link { color: #adb5bd; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 1rem 1.5rem; }
                .admin-tabs .nav-link.active { color: #0dcaf0; border-bottom: 2px solid #0dcaf0; background: transparent; font-weight: bold; }
                .admin-tabs .nav-link:hover:not(.active) { color: #fff; border-bottom: 2px solid #24282d; }
                .template-badge { transition: all 0.2s; }
                .template-badge:hover { opacity: 0.8; }
                .cursor-pointer { cursor: pointer; }
            ` }} />
            <SiteNavbar />

            <Container className="py-5 flex-grow-1 mb-5" style={{ maxWidth: '1200px' }}>
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h1 className="display-4 fw-bold mb-0">Admin Center</h1>
                        <p className="text-info small text-uppercase mt-2 opacity-75 font-monospace">Central Registry Management</p>
                    </div>
                    <Button variant="outline-light" size="sm" onClick={handleSignOut}>Logout Session</Button>
                </div>

                {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

                <Tabs defaultActiveKey="queue" id="admin-tabs" className="mb-5 admin-tabs border-secondary">

                    {/* 1. Review Queue */}
                    <Tab eventKey="queue" title={`1. Review Queue (${pendingParts.length})`}>
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : pendingParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No pending submissions found.
                                </div>
                            ) : (
                                <Row>
                                    {pendingParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <>
                                                <Button variant="success" size="sm" className="w-50 fw-bold" onClick={() => handleApprove(part.id!)}>Approve</Button>
                                                <Button variant="danger" size="sm" className="w-50 fw-bold" onClick={() => handleDeletePart(part.id!)}>Delete</Button>
                                            </>
                                        } />
                                    ))}
                                </Row>
                            )}
                        </div>
                    </Tab>

                    {/* 2. Registry Audit */}
                    <Tab eventKey="audit" title="2. Registry Audit">
                        <div className="mt-4">
                            <Alert variant="warning" className="bg-transparent border border-warning text-warning mb-4">
                                <strong>Audit Scan:</strong> Parts below share the same external listing URL. Review and remove duplicates if necessary.
                            </Alert>

                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="warning" /></div>
                            ) : duplicates.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No duplicate external URLs detected.
                                </div>
                            ) : (
                                duplicates.map((group, idx) => (
                                    <div key={idx} className="p-4 bg-secondary rounded border border-secondary mb-5 shadow-sm">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <Badge bg="warning" text="dark" className="px-3 py-2 fw-bold text-uppercase rounded-pill">Duplicate Listing</Badge>
                                            <span className="text-info font-monospace small">{group[0].external_url}</span>
                                        </div>
                                        <Row className="flex-nowrap overflow-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
                                            {group.map(part => (
                                                <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                                    <Button variant="danger" size="sm" className="w-100 fw-bold" onClick={() => handleDeletePart(part.id!)}>Delete Duplicate</Button>
                                                } />
                                            ))}
                                        </Row>
                                    </div>
                                ))
                            )}
                        </div>
                    </Tab>

                    {/* 3. Full Registry */}
                    <Tab eventKey="registry" title="3. Full Registry">
                        <div className="mt-4">
                            <div className="d-flex justify-content-between align-items-end mb-4">
                                <h4 className="fw-bold mb-0">Active JSON Registry</h4>
                                <Badge bg="secondary" className="px-3 py-2">{approvedParts.length} Total Parts</Badge>
                            </div>
                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : approvedParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No approved parts found.
                                </div>
                            ) : (
                                <Row>
                                    {approvedParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <Button variant="outline-danger" size="sm" className="w-100 fw-bold" onClick={() => handleDeletePart(part.id!, true)}>Revoke and Delete</Button>
                                        } />
                                    ))}
                                </Row>
                            )}
                        </div>
                    </Tab>

                    {/* 4. Part Categories */}
                    <Tab eventKey="categories" title="4. Part Categories">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Terminology & Tags</h5>
                            <p className="text-muted small mb-4">Add or remove part categories globally. Changes update `categories.json` upon publishing.</p>

                            <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                <div className="d-flex flex-wrap gap-2">
                                    {partCategories.map(cat => (
                                        <Badge key={cat.id} pill bg={selectedCategory?.id === cat.id ? "primary" : "secondary"} className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${selectedCategory?.id === cat.id ? 'border-primary' : 'border-dark'}`} onClick={() => { setSelectedCategory(cat); setEditCategoryName(cat.name); setCategoryDeleteConfirm(false); }}>
                                            {cat.name}
                                        </Badge>
                                    ))}
                                    {partCategories.length === 0 && <span className="text-muted small p-2">No categories defined yet.</span>}
                                </div>
                            </div>

                            {selectedCategory && (
                                <div className="mb-4 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-info fw-bold mb-3">Modify Category: <span className="text-white">{selectedCategory.name}</span></h6>
                                    {categoryDeleteConfirm ? (
                                        <Alert variant="danger" className="mb-0 bg-transparent border-danger text-danger d-flex flex-column gap-3">
                                            <div>
                                                <strong>Confirm Deletion:</strong> Are you sure you want to permanently delete the category <span className="fw-bold px-1 text-white bg-dark rounded">{selectedCategory.name}</span> globally? This will affect parts using this tag.
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button variant="danger" className="fw-bold" onClick={handleConfirmDeleteCategory}>Yes, Delete</Button>
                                                <Button variant="secondary" onClick={() => setCategoryDeleteConfirm(false)}>Cancel</Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control type="text" className="input-contrast p-3 border-0" value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()} />
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={handleUpdateCategory} disabled={editCategoryName.trim() === selectedCategory.name || !editCategoryName.trim()}>Save Name</Button>
                                            </InputGroup>
                                            <div className="d-flex justify-content-between">
                                                <Button variant="secondary" size="sm" className="fw-bold" onClick={() => setSelectedCategory(null)}>Close Editor</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => setCategoryDeleteConfirm(true)}>Delete "{selectedCategory.name}"</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <InputGroup className="w-100 shadow-sm">
                                <Form.Control type="text" placeholder="Enter new category name (e.g. Heatsink)..." className="input-contrast p-3" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddCategory}>Add Category</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                    {/* 5. Board Platforms */}
                    <Tab eventKey="platforms" title="5. Board Platforms">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Manufacturers & Platforms</h5>
                            <p className="text-muted small mb-4">Add or remove board platforms globally. Changes update `platforms.json` upon publishing.</p>

                            <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                <div className="d-flex flex-wrap gap-2">
                                    {boardPlatforms.map(plat => (
                                        <Badge key={plat.id} pill bg={selectedPlatform?.id === plat.id ? "primary" : "secondary"} className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${selectedPlatform?.id === plat.id ? 'border-primary' : 'border-dark'}`} onClick={() => { setSelectedPlatform(plat); setEditPlatformName(plat.name); setPlatformDeleteConfirm(false); }}>
                                            {plat.name}
                                        </Badge>
                                    ))}
                                    {boardPlatforms.length === 0 && <span className="text-muted small p-2">No platforms defined yet.</span>}
                                </div>
                            </div>

                            {selectedPlatform && (
                                <div className="mb-4 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-info fw-bold mb-3">Modify Platform: <span className="text-white">{selectedPlatform.name}</span></h6>
                                    {platformDeleteConfirm ? (
                                        <Alert variant="danger" className="mb-0 bg-transparent border-danger text-danger d-flex flex-column gap-3">
                                            <div>
                                                <strong>Confirm Deletion:</strong> Are you sure you want to permanently delete the platform <span className="fw-bold px-1 text-white bg-dark rounded">{selectedPlatform.name}</span> globally? This will affect parts using this tag.
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button variant="danger" className="fw-bold" onClick={handleConfirmDeletePlatform}>Yes, Delete</Button>
                                                <Button variant="secondary" onClick={() => setPlatformDeleteConfirm(false)}>Cancel</Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control type="text" className="input-contrast p-3 border-0" value={editPlatformName} onChange={e => setEditPlatformName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdatePlatform()} />
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={handleUpdatePlatform} disabled={editPlatformName.trim() === selectedPlatform.name || !editPlatformName.trim()}>Save Name</Button>
                                            </InputGroup>
                                            <div className="d-flex justify-content-between">
                                                <Button variant="secondary" size="sm" className="fw-bold" onClick={() => setSelectedPlatform(null)}>Close Editor</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => setPlatformDeleteConfirm(true)}>Delete "{selectedPlatform.name}"</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <InputGroup className="w-100 shadow-sm">
                                <Form.Control type="text" placeholder="Enter new platform name (e.g. Exway)..." className="input-contrast p-3" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPlatform()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddPlatform}>Add Platform</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                </Tabs>

                {editingPart && (
                    <Modal show={true} onHide={() => setEditingPart(null)} size="lg" data-bs-theme="dark" backdrop="static">
                        <Modal.Header closeButton className="bg-dark border-secondary text-light">
                            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                                Edit Part <Badge bg="primary">#{editingPart.id?.toString().substring(0, 5)}</Badge>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-dark text-light border-0">
                            <Form.Group className="mb-3">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Title *</Form.Label>
                                <Form.Control type="text" value={editingPart.title || ''} onChange={e => setEditingPart({ ...editingPart, title: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Project Link (cad_link) *</Form.Label>
                                <Form.Control type="text" value={editingPart.external_url || ''} onChange={e => setEditingPart({ ...editingPart, external_url: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Mirror Link (Optional)</Form.Label>
                                <Form.Control type="text" value={editingPart.dropbox_url || ''} onChange={e => setEditingPart({ ...editingPart, dropbox_url: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" placeholder="Dropbox, Google Drive, etc." />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Image URL</Form.Label>
                                <div className="d-flex gap-3 align-items-center">
                                    <Form.Control type="text" value={Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : (editingPart.image_src || '')} onChange={e => setEditingPart({ ...editingPart, image_src: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm flex-grow-1" />
                                    {editingPart.image_src && (
                                        <div className="rounded overflow-hidden border border-secondary" style={{ width: "60px", height: "60px", flexShrink: 0, backgroundColor: "#1a1d20" }}>
                                            <img src={Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : editingPart.image_src} alt="Preview" style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                    )}
                                </div>
                            </Form.Group>

                            <Row className="mb-4 gx-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Model Author (Optional)</Form.Label>
                                        <Form.Control type="text" value={editingPart.author || ''} onChange={e => setEditingPart({ ...editingPart, author: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" placeholder="e.g. John Doe" />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Submitted By (Optional)</Form.Label>
                                        <Form.Control type="text" value={editingPart.submitted_by || ''} onChange={e => setEditingPart({ ...editingPart, submitted_by: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" placeholder="Anonymous" />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {(() => {
                                const pinnedStreet = boardPlatforms.find(p => p.name === "Street (DIY/Generic)");
                                const pinnedOffroad = boardPlatforms.find(p => p.name === "Off-Road (DIY/Generic)");
                                const pinnedMisc = boardPlatforms.find(p => p.name === "Misc" || p.name === "Miscellaneous");

                                const others = boardPlatforms.filter(p => p.name !== "Street (DIY/Generic)" && p.name !== "Off-Road (DIY/Generic)" && p.name !== "Misc" && p.name !== "Miscellaneous");
                                const group1 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'A' && first <= 'I'; });
                                const group2 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
                                const group3 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

                                return (
                                    <Form.Group className="mb-4">
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-3">Manufacturer (Platform) *</Form.Label>
                                        <div className="bg-black p-4 rounded border border-secondary shadow-inner">
                                            <Row className="g-3 mb-4">
                                                <Col xs={12} lg={4}>
                                                    {pinnedStreet && (
                                                        <Badge
                                                            bg={editingPart.platform?.includes(pinnedStreet.name) ? "primary" : "none"}
                                                            className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                            style={{ fontSize: "0.85rem" }}
                                                            onClick={() => toggleArray('platform', pinnedStreet.name, editingPart.platform || [], true)}
                                                        >
                                                            {pinnedStreet.name}
                                                        </Badge>
                                                    )}
                                                </Col>
                                                <Col xs={12} lg={4}>
                                                    {pinnedOffroad && (
                                                        <Badge
                                                            bg={editingPart.platform?.includes(pinnedOffroad.name) ? "primary" : "none"}
                                                            className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                            style={{ fontSize: "0.85rem" }}
                                                            onClick={() => toggleArray('platform', pinnedOffroad.name, editingPart.platform || [], true)}
                                                        >
                                                            {pinnedOffroad.name}
                                                        </Badge>
                                                    )}
                                                </Col>
                                                <Col xs={12} lg={4}>
                                                    {pinnedMisc && (
                                                        <Badge
                                                            bg={editingPart.platform?.includes(pinnedMisc.name) ? "primary" : "none"}
                                                            className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                            style={{ fontSize: "0.85rem" }}
                                                            onClick={() => toggleArray('platform', pinnedMisc.name, editingPart.platform || [], true)}
                                                        >
                                                            {pinnedMisc.name}
                                                        </Badge>
                                                    )}
                                                </Col>
                                            </Row>

                                            <h3 className="h6 fw-bold text-muted mb-3 uppercase letter-spacing-1 border-bottom border-secondary pb-2 text-center">Brands</h3>

                                            <Row className="g-4">
                                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                    <div className="text-center mb-1">
                                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">A - I</span>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {group1.map(opt => (
                                                            <Badge key={opt.id} role="button" bg={editingPart.platform?.includes(opt.name) ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => toggleArray('platform', opt.name, editingPart.platform || [], true)}>
                                                                {opt.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </Col>
                                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                    <div className="text-center mb-1">
                                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">J - R</span>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {group2.map(opt => (
                                                            <Badge key={opt.id} role="button" bg={editingPart.platform?.includes(opt.name) ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => toggleArray('platform', opt.name, editingPart.platform || [], true)}>
                                                                {opt.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </Col>
                                                <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                    <div className="text-center mb-1">
                                                        <span className="small fw-bold text-muted uppercase letter-spacing-1">S - Z</span>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {group3.map(opt => (
                                                            <Badge key={opt.id} role="button" bg={editingPart.platform?.includes(opt.name) ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => toggleArray('platform', opt.name, editingPart.platform || [], true)}>
                                                                {opt.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Form.Group>
                                );
                            })()}

                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Category *</Form.Label>
                                <div className="d-flex flex-wrap gap-2 p-4 bg-black rounded border border-secondary shadow-inner">
                                    {partCategories.map(c => (
                                        <Badge key={c.id} role="button" bg={editingPart.type_of_part?.includes(c.name) ? "primary" : "none"} className="border border-light p-2 cursor-pointer shadow-sm text-wrap lh-sm" onClick={() => toggleArray('type_of_part', c.name, editingPart.type_of_part || [], true)}>
                                            {c.name}
                                        </Badge>
                                    ))}
                                </div>
                            </Form.Group>

                            <Row className="mb-4">
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light d-block">Fab Method *</Form.Label>
                                        <div className="d-flex flex-wrap gap-2 p-3 bg-black rounded border border-secondary shadow-inner">
                                            {["3d Printed", "CNC", "Molded", "Other"].map(f => (
                                                <Button key={f} size="sm" variant={editingPart.fabrication_method?.includes(f) ? "primary" : "outline-light"} onClick={() => toggleArray('fabrication_method', f, editingPart.fabrication_method || [])}>
                                                    {f}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="d-flex align-items-center">
                                    <Form.Check type="checkbox" id="edit-oem" label="OEM PART" checked={editingPart.is_oem || false} onChange={e => setEditingPart({ ...editingPart, is_oem: e.target.checked })} className="fw-bold text-primary mt-3" />
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer className="bg-dark border-secondary p-4">
                            <Button variant="secondary" onClick={() => setEditingPart(null)} className="px-4">Cancel</Button>
                            <Button variant="success" className="px-5 fw-bold shadow-lg" onClick={handleSaveEdit} disabled={isSavingEdit}>
                                {isSavingEdit ? <><Spinner size="sm" animation="border" className="me-2" /> Saving...</> : "Publish Changes"}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}
            </Container>
            <SiteFooter />
        </div>
    );
}
