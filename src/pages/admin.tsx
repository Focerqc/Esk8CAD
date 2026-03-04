import { type PageProps } from "gatsby"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Alert, Spinner, Tabs, Tab, Row, Col, Badge, Stack, InputGroup, Modal } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import HardwareFields from "../components/Forms/HardwareFields"
import { getSupabaseClient, Part } from "../lib/supabase"
import { SupabaseClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js"

// Admin UI Sync Force Rebuild 1.2
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

    // Get metadata from joined objects or fallback to legacy arrays
    const brandName = (part as any).brands?.name || (part.platform && part.platform.length > 0 ? part.platform[0] : "No Platform");
    const methodName = (part as any).fabrication_methods?.name || (part.fabrication_method && part.fabrication_method.length > 0 ? part.fabrication_method[0] : "");
    const categoryName = (part as any).part_categories?.name || (part.type_of_part && part.type_of_part.length > 0 ? part.type_of_part[0] : "");
    const modelName = (part as any).models?.name || part.board_model || "";

    return (
        <Col xs={12} sm={12} md={6} lg={4} xl={4} className="mb-4 d-flex align-items-stretch" style={{ minWidth: '320px', flexShrink: 0 }}>
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
                            <Card.Title as="h5" className="mb-1 fw-bold text-white text-truncate" title={part.title} style={{ minWidth: 0 }}>
                                {part.needs_model_review && <span className="me-2" title="Needs Model Review">🚩</span>}
                                {part.title}
                            </Card.Title>
                        </div>
                        <Card.Subtitle className="mb-3 text-muted small">
                            By: <span className="text-light">{author}</span>
                        </Card.Subtitle>

                        <div className="mb-3">
                            <span className="text-info fw-bold small me-2 d-block mb-2 text-uppercase letter-spacing-1">{brandName}</span>
                            <div className="d-flex flex-wrap gap-1">
                                {categoryName && <Badge pill bg="secondary" className="border border-secondary py-1 px-2 text-truncate" style={{ maxWidth: '150px' }}>{categoryName}</Badge>}
                                {methodName && <Badge pill bg="dark" className="border border-secondary py-1 px-2 text-truncate" style={{ maxWidth: '150px' }}>{methodName}</Badge>}
                                {part.is_oem && <Badge pill bg="none" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }} className="border py-1 px-2">OEM</Badge>}
                                {modelName && <Badge pill bg="warning" text="dark" className="py-1 px-2 border border-warning" style={{ fontSize: '0.7rem' }}>{modelName}</Badge>}
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
                            <Button variant="outline-primary" size="sm" className="w-100 fw-bold mb-2 py-2" onClick={onEdit}>Edit Part</Button>
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
    const [hiddenParts, setHiddenParts] = useState<Part[]>([]);
    const [deletedParts, setDeletedParts] = useState<Part[]>([]);
    const [isDeletedLoading, setIsDeletedLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [fabricationMethods, setFabricationMethods] = useState<Taxonomy[]>([]);
    const [partCategories, setPartCategories] = useState<Taxonomy[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [newFabMethod, setNewFabMethod] = useState("");
    const [newPartCategory, setNewPartCategory] = useState("");
    const [newPlatform, setNewPlatform] = useState("");

    const [selectedFabMethod, setSelectedFabMethod] = useState<Taxonomy | null>(null);
    const [editFabMethodName, setEditFabMethodName] = useState("");
    const [fabMethodDeleteConfirm, setFabMethodDeleteConfirm] = useState(false);

    const [selectedPartCategory, setSelectedPartCategory] = useState<Taxonomy | null>(null);
    const [editPartCategoryName, setEditPartCategoryName] = useState("");
    const [partCategoryDeleteConfirm, setPartCategoryDeleteConfirm] = useState(false);

    const [selectedPlatform, setSelectedPlatform] = useState<Taxonomy | null>(null);
    const [editPlatformName, setEditPlatformName] = useState("");
    const [platformDeleteConfirm, setPlatformDeleteConfirm] = useState(false);

    const [editBoardModelOld, setEditBoardModelOld] = useState<string>("");
    const [editBoardModelNew, setEditBoardModelNew] = useState<string>("");

    const [showAddModel, setShowAddModel] = useState(false);
    const [newModelBrand, setNewModelBrand] = useState<string>("");
    const [newModelName, setNewModelName] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [isHiddenLoading, setIsHiddenLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleSaveEdit = async () => {
        if (!supabase || !editingPart || !editingPart.id) return;
        setIsSavingEdit(true);
        try {
            // Securely bind state to validated schema fields
            const safeImageSrc = Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : editingPart.image_src;

            const payload = {
                title: editingPart.title?.trim() || 'Untitled',
                external_url: editingPart.external_url?.trim() || null,
                image_src: safeImageSrc?.trim() || null,
                author: editingPart.author?.trim() || null,
                submitted_by: editingPart.submitted_by?.trim() || 'Anonymous',
                platform_id: editingPart.platform_id || null, // Capture UUID
                category_id: editingPart.category_id || null, // Capture UUID
                fabrication_method_id: editingPart.fabrication_method_id || null, // Capture UUID
                model_id: (editingPart.model_id && editingPart.model_id.length === 36) ? editingPart.model_id : null,
                board_model: (!editingPart.model_id || editingPart.model_id.length !== 36) ? editingPart.model_id : null,
                is_oem: editingPart.is_oem || false,
                dropbox_url: editingPart.dropbox_url?.trim() || null,
                release_year: editingPart.release_year || null,
                needs_model_review: editingPart.needs_model_review || false,
            };
            const { error: sbError } = await supabase.from('parts').update(payload).eq('id', editingPart.id);
            if (sbError) throw sbError;

            // Success - refresh the list to see joined data
            fetchData();
            fetchHiddenData();
            setEditingPart(null);
        } catch (err: any) {
            setError('Failed to save edits: ' + (err.message || String(err)));
        } finally {
            setIsSavingEdit(false);
        }
    };


    const allActiveParts = useMemo(() => [...parts, ...hiddenParts], [parts, hiddenParts]);

    // Filtered lists
    const pendingParts = allActiveParts.filter(p => p.status === 'pending');
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

    const groupedBoardModels = useMemo(() => {
        const groups: Record<string, Set<any>> = {};

        // Use the models taxonomy we fetched instead of scraping parts
        models.forEach(m => {
            const brand = brands.find(b => b.id === m.brand_id);
            const brandName = brand ? brand.name : "Unknown Brand";
            if (!groups[brandName]) groups[brandName] = new Set();
            groups[brandName].add(m);
        });

        const result = Object.entries(groups).map(([brand, modelsSet]) => ({
            brand,
            models: Array.from(modelsSet).sort((a, b) => (a as any).name.localeCompare((b as any).name))
        })).sort((a, b) => a.brand.localeCompare(b.brand));

        return {
            groups: result,
            orphans: [] as string[]
        };
    }, [models, brands]);

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
            // Use table joins to get metadata names
            const { data: pData, error: pError } = await supabase
                .from('parts')
                .select('*, brands(name), part_categories(name), fabrication_methods(name), models(name)')
                .eq('is_hidden', false)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (pError) throw pError;
            setParts((pData as any[]) || []);

            const { data: cData } = await supabase.from('fabrication_methods').select('*').order('name');
            if (cData) setFabricationMethods(cData);

            const { data: catData } = await supabase.from('part_categories').select('*').order('name');
            if (catData) setPartCategories(catData);

            const { data: bData } = await supabase.from('brands').select('*').order('name');
            if (bData) setBrands(bData);

            const { data: modData } = await supabase.from('models').select('*').order('name');
            if (modData) setModels(modData);
        } catch (err: any) {
            setError(err.message || 'Error fetching data.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHiddenData = async () => {
        if (!supabase) return;
        setIsHiddenLoading(true);
        try {
            const { data: hData, error: hError } = await supabase
                .from('parts')
                .select('*, brands(name), part_categories(name), fabrication_methods(name), models(name)')
                .eq('is_hidden', true)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (hError) throw hError;
            setHiddenParts((hData as any[]) || []);
        } catch (err: any) {
            setError(err.message || 'Error fetching hidden data.');
        } finally {
            setIsHiddenLoading(false);
        }
    };

    const fetchDeletedData = async () => {
        if (!supabase) return;
        setIsDeletedLoading(true);
        try {
            const { data: dData, error: dError } = await supabase.from('parts').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
            if (dError) throw dError;
            setDeletedParts((dData as Part[]) || []);
        } catch (err: any) {
            setError(err.message || 'Error fetching deleted data.');
        } finally {
            setIsDeletedLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
            fetchHiddenData();
            fetchDeletedData();
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
        setActionLoadingId(id);
        try {
            const { error: sbError } = await supabase.from('parts').update({ status: 'approved', is_hidden: false }).eq('id', id);
            if (sbError) throw sbError;

            // Re-fetch to correctly distribute the part into the approved state
            fetchData();
            fetchHiddenData();
        } catch (err: any) {
            setError('Failed to approve: ' + (err.message || String(err)));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleHidePart = async (id: string) => {
        if (!supabase) return;
        if (!window.confirm("Hide Part? Are you sure you want to soft-hide this part from the public side?")) return;
        setActionLoadingId(id);
        try {
            const { error: sbError } = await supabase.from('parts').update({ is_hidden: true }).eq('id', id);
            if (sbError) throw sbError;

            const hiddenTarget = parts.find(p => p.id === id);
            setParts(prev => prev.filter(p => p.id !== id));
            if (hiddenTarget) {
                setHiddenParts(prev => [{ ...hiddenTarget, is_hidden: true }, ...prev]);
            }
        } catch (err: any) {
            setError('Failed to hide part: ' + (err.message || String(err)));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSoftDeletePart = async (id: string) => {
        if (!supabase) return;
        if (!window.confirm('Move to Trash? Are you sure you want to delete this part?')) return;
        setActionLoadingId(id);
        try {
            const now = new Date().toISOString();
            const { error: sbError } = await supabase.from('parts').update({ deleted_at: now }).eq('id', id);
            if (sbError) throw sbError;

            let target = parts.find(p => p.id === id) || hiddenParts.find(p => p.id === id);
            setParts(prev => prev.filter(p => p.id !== id));
            setHiddenParts(prev => prev.filter(p => p.id !== id));
            if (target) {
                setDeletedParts(prev => [{ ...target!, deleted_at: now }, ...prev]);
            }
        } catch (err: any) {
            setError('Failed to delete: ' + (err.message || String(err)));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handlePermDeletePart = async (id: string) => {
        if (!supabase) return;
        if (!window.confirm('Permanent Delete! You cannot undo this. Continue?')) return;
        setActionLoadingId(id);
        try {
            const { error: sbError } = await supabase.from('parts').delete().eq('id', id);
            if (sbError) throw sbError;
            setDeletedParts(prev => prev.filter(p => p.id !== id));
            setParts(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError('Failed to permanently delete: ' + (err.message || String(err)));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRestorePart = async (id: string, fromState: 'hidden' | 'deleted') => {
        if (!supabase) return;
        if (!window.confirm("Restore Part? Are you sure you want to restore this part?")) return;
        setActionLoadingId(id);
        try {
            if (fromState === 'hidden') {
                const { error: sbError } = await supabase.from('parts').update({ is_hidden: false }).eq('id', id);
                if (sbError) throw sbError;

                const restoredPart = hiddenParts.find(p => p.id === id);
                setHiddenParts(prev => prev.filter(p => p.id !== id));
                if (restoredPart) setParts(prev => [{ ...restoredPart, is_hidden: false }, ...prev]);
            } else {
                const { error: sbError } = await supabase.from('parts').update({ deleted_at: null }).eq('id', id);
                if (sbError) throw sbError;

                const restoredPart = deletedParts.find(p => p.id === id);
                setDeletedParts(prev => prev.filter(p => p.id !== id));
                if (restoredPart) {
                    if (restoredPart.is_hidden) setHiddenParts(prev => [{ ...restoredPart, deleted_at: null }, ...prev]);
                    else setParts(prev => [{ ...restoredPart, deleted_at: null }, ...prev]);
                }
            }
        } catch (err: any) {
            setError('Failed to restore part: ' + (err.message || String(err)));
        } finally {
            setActionLoadingId(null);
        }
    };

    // --- TAXONOMY HANDLERS ---
    const handleAddFabMethod = async () => {
        if (!newFabMethod.trim() || !supabase) return;
        try {
            const methodName = newFabMethod.trim();
            const slug = generateSlug(methodName);
            const { data, error: sbError } = await supabase.from('fabrication_methods').insert([{ name: methodName, slug }]).select();
            if (sbError) throw sbError;
            if (data && data.length) {
                setFabricationMethods(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
                setNewFabMethod('');
            }
        } catch (err: any) {
            setError('Failed to add category: ' + (err.message || String(err)));
        }
    };

    const handleUpdateFabMethod = async () => {
        if (!selectedFabMethod || !editFabMethodName.trim() || !supabase) return;
        try {
            const { error: sbError } = await supabase.from('fabrication_methods').update({ name: editFabMethodName.trim() }).eq('id', selectedFabMethod.id);
            if (sbError) throw sbError;
            setFabricationMethods(prev => prev.map(c => c.id === selectedFabMethod.id ? { ...c, name: editFabMethodName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedFabMethod(null);
            setEditFabMethodName("");
        } catch (err: any) {
            setError('Failed to update category: ' + (err.message || String(err)));
        }
    };

    const handleConfirmDeleteFabMethod = async () => {
        if (!selectedFabMethod || !supabase) return;
        try {
            const id = selectedFabMethod.id;
            const { error: sbError } = await supabase.from('fabrication_methods').delete().eq('id', id);
            if (sbError) throw sbError;
            setFabricationMethods(prev => prev.filter(c => c.id !== id));
            setSelectedFabMethod(null);
            setFabMethodDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete fabrication method: ' + (err.message || String(err)));
            fetchData();
        }
    };

    const handleAddPartCategory = async () => {
        if (!newPartCategory.trim() || !supabase) return;
        try {
            const categoryName = newPartCategory.trim();
            const slug = generateSlug(categoryName);
            const { data, error: sbError } = await supabase.from('part_categories').insert([{ name: categoryName, slug }]).select();
            if (sbError) throw sbError;
            if (data && data.length) {
                setPartCategories(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
                setNewPartCategory('');
            }
        } catch (err: any) {
            setError('Failed to add category: ' + (err.message || String(err)));
        }
    };

    const handleUpdatePartCategory = async () => {
        if (!selectedPartCategory || !editPartCategoryName.trim() || !supabase) return;
        try {
            const { error: sbError } = await supabase.from('part_categories').update({ name: editPartCategoryName.trim() }).eq('id', selectedPartCategory.id);
            if (sbError) throw sbError;
            setPartCategories(prev => prev.map(c => c.id === selectedPartCategory.id ? { ...c, name: editPartCategoryName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedPartCategory(null);
            setEditPartCategoryName("");
        } catch (err: any) {
            setError('Failed to update category: ' + (err.message || String(err)));
        }
    };

    const handleConfirmDeletePartCategory = async () => {
        if (!selectedPartCategory || !supabase) return;
        try {
            const id = selectedPartCategory.id;
            const { error: sbError } = await supabase.from('part_categories').delete().eq('id', id);
            if (sbError) throw sbError;
            setPartCategories(prev => prev.filter(c => c.id !== id));
            setSelectedPartCategory(null);
            setPartCategoryDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete category: ' + (err.message || String(err)));
            fetchData();
        }
    };

    const handleAddPlatform = async () => {
        if (!newPlatform.trim() || !supabase) return;
        setIsLoading(true);
        try {
            const platformName = newPlatform.trim();
            const slug = platformName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const { data, error: sbError } = await supabase.from('brands').insert([{ name: platformName, slug }]).select();
            if (sbError) throw sbError;

            if (data && data.length) {
                setBrands(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
                setNewPlatform('');
            }
        } catch (err: any) {
            setError('Failed to add platform: ' + (err.message || String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePlatform = async () => {
        if (!selectedPlatform || !editPlatformName.trim() || !supabase) return;
        setIsLoading(true);
        try {
            const { error: sbError } = await supabase.from('brands').update({ name: editPlatformName.trim() }).eq('id', selectedPlatform.id);
            if (sbError) throw sbError;
            setBrands(prev => prev.map(c => c.id === selectedPlatform.id ? { ...c, name: editPlatformName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedPlatform(null);
            setEditPlatformName("");
        } catch (err: any) {
            setError('Failed to update platform: ' + (err.message || String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDeletePlatform = async () => {
        if (!selectedPlatform || !supabase) return;
        setIsLoading(true);
        try {
            const id = selectedPlatform.id;
            const { error: sbError } = await supabase.from('brands').delete().eq('id', id);
            if (sbError) throw sbError;
            setBrands(prev => prev.filter(c => c.id !== id));
            setSelectedPlatform(null);
            setPlatformDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete platform: ' + (err.message || String(err)));
            fetchData();
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateBoardModel = async () => {
        if (!editBoardModelOld || !supabase) return;
        setIsLoading(true);
        try {
            const newValue = editBoardModelNew.trim();
            if (!newValue) return;

            // Find the model object
            const modelObj = models.find(m => m.name === editBoardModelOld);
            if (!modelObj) throw new Error("Model not found in taxonomy.");

            const { error: sbError } = await supabase
                .from('models')
                .update({ name: newValue })
                .eq('id', modelObj.id);

            if (sbError) throw sbError;

            // Refresh models
            const { data: modData } = await supabase.from('models').select('*').order('name');
            if (modData) setModels(modData);

            setEditBoardModelOld("");
            setEditBoardModelNew("");
        } catch (err: any) {
            setError('Failed to update board model: ' + (err.message || String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleAddBoardModel = async () => {
        if (!newModelBrand || !newModelName.trim() || !supabase) return;
        setIsLoading(true);
        try {
            // Find the brand ID for the selected brand name
            const brandObj = brands.find(b => b.name === newModelBrand);
            if (!brandObj) throw new Error("Selected platform/brand not found.");

            const slug = generateSlug(newModelName);
            const { data, error: sbError } = await supabase
                .from('models')
                .insert([{ name: newModelName.trim(), brand_id: brandObj.id, slug }])
                .select();

            if (sbError) throw sbError;

            if (data && data.length) {
                setModels(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
            }

            setShowAddModel(false);
            setNewModelBrand("");
            setNewModelName("");
            setEditBoardModelOld("");
            setEditBoardModelNew("");
        } catch (err: any) {
            setError('Failed to add board model: ' + (err.message || String(err)));
        } finally {
            setIsLoading(false);
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
                                                <Button variant="success" size="sm" className="w-50 fw-bold" onClick={() => handleApprove(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Approve'}
                                                </Button>
                                                <Button variant="danger" size="sm" className="w-50 fw-bold" onClick={() => handlePermDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Reject/Del'}
                                                </Button>
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
                                                    <Button variant="danger" size="sm" className="w-100 fw-bold" onClick={() => handlePermDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                        {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Delete Duplicate'}
                                                    </Button>
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
                                            <>
                                                <Button variant="outline-warning" size="sm" className="w-50 fw-bold" onClick={() => handleHidePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Hide'}
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="w-50 fw-bold" onClick={() => handleSoftDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Delete'}
                                                </Button>
                                            </>
                                        } />
                                    ))}
                                </Row>
                            )}
                        </div>
                    </Tab>

                    {/* 4. Part Categories */}
                    <Tab eventKey="categories" title="4. Part Categories">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Part Categories</h5>
                            <p className="text-muted small mb-4">Add or remove part categories globally (e.g. Battery, Motor, Deck).</p>

                            <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                <div className="d-flex flex-wrap gap-2">
                                    {partCategories.map(cat => (
                                        <Badge key={cat.id} pill bg={selectedPartCategory?.id === cat.id ? "primary" : "secondary"} className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${selectedPartCategory?.id === cat.id ? 'border-primary' : 'border-dark'}`} onClick={() => { setSelectedPartCategory(cat); setEditPartCategoryName(cat.name); setPartCategoryDeleteConfirm(false); }}>
                                            {cat.name}
                                        </Badge>
                                    ))}
                                    {partCategories.length === 0 && <span className="text-muted small p-2">No categories defined yet.</span>}
                                </div>
                            </div>

                            {selectedPartCategory && (
                                <div className="mb-4 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-info fw-bold mb-3">Modify Category: <span className="text-white">{selectedPartCategory.name}</span></h6>
                                    {partCategoryDeleteConfirm ? (
                                        <Alert variant="danger" className="mb-0 bg-transparent border-danger text-danger d-flex flex-column gap-3">
                                            <div>
                                                <strong>Confirm Deletion:</strong> Are you sure you want to permanently delete the category <span className="fw-bold px-1 text-white bg-dark rounded">{selectedPartCategory.name}</span> globally?
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button variant="danger" className="fw-bold" onClick={handleConfirmDeletePartCategory}>Yes, Delete</Button>
                                                <Button variant="secondary" onClick={() => setPartCategoryDeleteConfirm(false)}>Cancel</Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control type="text" className="input-contrast p-3 border-0" value={editPartCategoryName} onChange={e => setEditPartCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdatePartCategory()} />
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={handleUpdatePartCategory} disabled={editPartCategoryName.trim() === selectedPartCategory.name || !editPartCategoryName.trim()}>Save Name</Button>
                                            </InputGroup>
                                            <div className="d-flex justify-content-between">
                                                <Button variant="secondary" size="sm" className="fw-bold" onClick={() => setSelectedPartCategory(null)}>Close Editor</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => setPartCategoryDeleteConfirm(true)}>Delete "{selectedPartCategory.name}"</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <InputGroup className="w-100 shadow-sm">
                                <Form.Control type="text" placeholder="Enter new category name (e.g. Remote)..." className="input-contrast p-3" value={newPartCategory} onChange={e => setNewPartCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPartCategory()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddPartCategory}>Add Category</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                    {/* 5. Fabrication Methods */}
                    <Tab eventKey="fabrication_methods" title="5. Fabrication Methods">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Fabrication Methods</h5>
                            <p className="text-muted small mb-4">Add or remove fabrication methods (e.g. 3D Print, CNC, Injection Molded).</p>

                            <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                <div className="d-flex flex-wrap gap-2">
                                    {fabricationMethods.map(cat => (
                                        <Badge key={cat.id} pill bg={selectedFabMethod?.id === cat.id ? "primary" : "secondary"} className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${selectedFabMethod?.id === cat.id ? 'border-primary' : 'border-dark'}`} onClick={() => { setSelectedFabMethod(cat); setEditFabMethodName(cat.name); setFabMethodDeleteConfirm(false); }}>
                                            {cat.name}
                                        </Badge>
                                    ))}
                                    {fabricationMethods.length === 0 && <span className="text-muted small p-2">No methods defined yet.</span>}
                                </div>
                            </div>

                            {selectedFabMethod && (
                                <div className="mb-4 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-info fw-bold mb-3">Modify Method: <span className="text-white">{selectedFabMethod.name}</span></h6>
                                    {fabMethodDeleteConfirm ? (
                                        <Alert variant="danger" className="mb-0 bg-transparent border-danger text-danger d-flex flex-column gap-3">
                                            <div>
                                                <strong>Confirm Deletion:</strong> Are you sure you want to permanently delete the method <span className="fw-bold px-1 text-white bg-dark rounded">{selectedFabMethod.name}</span> globally?
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button variant="danger" className="fw-bold" onClick={handleConfirmDeleteFabMethod}>Yes, Delete</Button>
                                                <Button variant="secondary" onClick={() => setFabMethodDeleteConfirm(false)}>Cancel</Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control type="text" className="input-contrast p-3 border-0" value={editFabMethodName} onChange={e => setEditFabMethodName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateFabMethod()} />
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={handleUpdateFabMethod} disabled={editFabMethodName.trim() === selectedFabMethod.name || !editFabMethodName.trim()}>Save Name</Button>
                                            </InputGroup>
                                            <div className="d-flex justify-content-between">
                                                <Button variant="secondary" size="sm" className="fw-bold" onClick={() => setSelectedFabMethod(null)}>Close Editor</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => setFabMethodDeleteConfirm(true)}>Delete "{selectedFabMethod.name}"</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <InputGroup className="w-100 shadow-sm">
                                <Form.Control type="text" placeholder="Enter new fabrication method (e.g. Carbon Fiber)..." className="input-contrast p-3" value={newFabMethod} onChange={e => setNewFabMethod(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFabMethod()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddFabMethod}>Add Method</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                    {/* 6. Board Platforms */}
                    <Tab eventKey="platforms" title="6. Board Platforms">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Manufacturers & Platforms</h5>
                            <p className="text-muted small mb-4">Add or remove board platforms globally. Changes update `platforms.json` upon publishing.</p>

                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : (
                                <>
                                    <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                        {(() => {
                                            const pinnedStreet = brands.find(p => p.name === "Street (DIY/Generic)");
                                            const pinnedOffroad = brands.find(p => p.name === "Off-Road (DIY/Generic)");
                                            const pinnedMisc = brands.find(p => p.name === "Misc" || p.name === "Miscellaneous");

                                            const others = brands.filter(p => !["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Miscellaneous"].includes(p.name));
                                            const group1 = others.filter(p => { const first = p.name[0].toUpperCase(); return (first >= '0' && first <= '9') || (first >= 'A' && first <= 'I'); });
                                            const group2 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
                                            const group3 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

                                            return (
                                                <>
                                                    <Row className="g-3 mb-4">
                                                        <Col xs={12} lg={4}>
                                                            {pinnedStreet && (
                                                                <Badge
                                                                    bg={selectedPlatform?.id === pinnedStreet.id ? "primary" : "secondary"}
                                                                    className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${selectedPlatform?.id === pinnedStreet.id ? 'border-primary' : 'border-dark'}`}
                                                                    style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                    onClick={() => { setSelectedPlatform(pinnedStreet); setEditPlatformName(pinnedStreet.name); setPlatformDeleteConfirm(false); }}
                                                                >
                                                                    {pinnedStreet.name}
                                                                </Badge>
                                                            )}
                                                        </Col>
                                                        <Col xs={12} lg={4}>
                                                            {pinnedOffroad && (
                                                                <Badge
                                                                    bg={selectedPlatform?.id === pinnedOffroad.id ? "primary" : "secondary"}
                                                                    className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${selectedPlatform?.id === pinnedOffroad.id ? 'border-primary' : 'border-dark'}`}
                                                                    style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                    onClick={() => { setSelectedPlatform(pinnedOffroad); setEditPlatformName(pinnedOffroad.name); setPlatformDeleteConfirm(false); }}
                                                                >
                                                                    {pinnedOffroad.name}
                                                                </Badge>
                                                            )}
                                                        </Col>
                                                        <Col xs={12} lg={4}>
                                                            {pinnedMisc && (
                                                                <Badge
                                                                    bg={selectedPlatform?.id === pinnedMisc.id ? "primary" : "secondary"}
                                                                    className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${selectedPlatform?.id === pinnedMisc.id ? 'border-primary' : 'border-dark'}`}
                                                                    style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                    onClick={() => { setSelectedPlatform(pinnedMisc); setEditPlatformName(pinnedMisc.name); setPlatformDeleteConfirm(false); }}
                                                                >
                                                                    {pinnedMisc.name}
                                                                </Badge>
                                                            )}
                                                        </Col>
                                                    </Row>

                                                    <h3 className="h6 fw-bold text-light mb-3 uppercase letter-spacing-1 border-bottom border-secondary pb-2 text-center">Brands</h3>

                                                    <Row className="g-4">
                                                        <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                            <div className="text-center mb-1">
                                                                <span className="small fw-bold text-light uppercase letter-spacing-1">A - I</span>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {group1.map(opt => (
                                                                    <Badge
                                                                        key={opt.id}
                                                                        role="button"
                                                                        bg={selectedPlatform?.id === opt.id ? "primary" : "secondary"}
                                                                        className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${selectedPlatform?.id === opt.id ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                        onClick={() => { setSelectedPlatform(opt); setEditPlatformName(opt.name); setPlatformDeleteConfirm(false); }}
                                                                    >
                                                                        {opt.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </Col>
                                                        <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                            <div className="text-center mb-1">
                                                                <span className="small fw-bold text-light uppercase letter-spacing-1">J - R</span>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {group2.map(opt => (
                                                                    <Badge
                                                                        key={opt.id}
                                                                        role="button"
                                                                        bg={selectedPlatform?.id === opt.id ? "primary" : "secondary"}
                                                                        className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${selectedPlatform?.id === opt.id ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                        onClick={() => { setSelectedPlatform(opt); setEditPlatformName(opt.name); setPlatformDeleteConfirm(false); }}
                                                                    >
                                                                        {opt.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </Col>
                                                        <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                            <div className="text-center mb-1">
                                                                <span className="small fw-bold text-light uppercase letter-spacing-1">S - Z</span>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {group3.map(opt => (
                                                                    <Badge
                                                                        key={opt.id}
                                                                        role="button"
                                                                        bg={selectedPlatform?.id === opt.id ? "primary" : "secondary"}
                                                                        className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${selectedPlatform?.id === opt.id ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                        onClick={() => { setSelectedPlatform(opt); setEditPlatformName(opt.name); setPlatformDeleteConfirm(false); }}
                                                                    >
                                                                        {opt.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    {brands.length === 0 && <span className="text-muted small p-2 d-block text-center mt-3">No platforms defined yet.</span>}
                                                </>
                                            );
                                        })()}
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
                                </>
                            )}
                        </div>
                    </Tab>

                    {/* 7. Manage Board Models */}
                    <Tab eventKey="models" title="7. Manage Board Models">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-info fw-bold mb-0">Hardware Context (Board Models)</h5>
                                <Button variant="primary" className="fw-bold px-3 py-2 shadow-sm border border-secondary" onClick={() => { setShowAddModel(!showAddModel); setNewModelBrand(""); setNewModelName(""); setEditBoardModelOld(""); setEditBoardModelNew(""); }}>
                                    {showAddModel ? 'Close Tool' : 'Add Board Model'}
                                </Button>
                            </div>
                            <p className="text-muted small mb-4">Board models are dynamic tags attached directly to parts. Grouped by their primary manufacturer context below.</p>

                            {/* ADD NEW MODEL TOOL */}
                            {showAddModel && (
                                <div className="mb-5 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-white fw-bold mb-4 border-bottom border-secondary pb-2">Add New Board Model</h6>

                                    <div className="mb-4">
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-3">1. Select Parent Brand (Platform) *</Form.Label>
                                        <div className="bg-black p-4 rounded border border-secondary shadow-inner">
                                            {(() => {
                                                const pinnedStreet = brands.find(p => p.name === "Street (DIY/Generic)");
                                                const pinnedOffroad = brands.find(p => p.name === "Off-Road (DIY/Generic)");
                                                const pinnedMisc = brands.find(p => p.name === "Misc" || p.name === "Miscellaneous");

                                                const others = brands.filter(p => !["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Miscellaneous"].includes(p.name));
                                                const group1 = others.filter(p => { const first = p.name[0].toUpperCase(); return (first >= '0' && first <= '9') || (first >= 'A' && first <= 'I'); });
                                                const group2 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
                                                const group3 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

                                                return (
                                                    <>
                                                        <Row className="g-3 mb-4">
                                                            <Col xs={12} lg={4}>
                                                                {pinnedStreet && (
                                                                    <Badge
                                                                        bg={newModelBrand === pinnedStreet.name ? "primary" : "secondary"}
                                                                        className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${newModelBrand === pinnedStreet.name ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                        onClick={() => setNewModelBrand(pinnedStreet.name)}
                                                                    >
                                                                        {pinnedStreet.name}
                                                                    </Badge>
                                                                )}
                                                            </Col>
                                                            <Col xs={12} lg={4}>
                                                                {pinnedOffroad && (
                                                                    <Badge
                                                                        bg={newModelBrand === pinnedOffroad.name ? "primary" : "secondary"}
                                                                        className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${newModelBrand === pinnedOffroad.name ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                        onClick={() => setNewModelBrand(pinnedOffroad.name)}
                                                                    >
                                                                        {pinnedOffroad.name}
                                                                    </Badge>
                                                                )}
                                                            </Col>
                                                            <Col xs={12} lg={4}>
                                                                {pinnedMisc && (
                                                                    <Badge
                                                                        bg={newModelBrand === pinnedMisc.name ? "primary" : "secondary"}
                                                                        className={`p-3 border cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center ${newModelBrand === pinnedMisc.name ? 'border-primary' : 'border-dark'}`}
                                                                        style={{ fontSize: "0.85rem", transition: 'all 0.2s' }}
                                                                        onClick={() => setNewModelBrand(pinnedMisc.name)}
                                                                    >
                                                                        {pinnedMisc.name}
                                                                    </Badge>
                                                                )}
                                                            </Col>
                                                        </Row>

                                                        <Row className="g-4">
                                                            <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                                <div className="text-center mb-1">
                                                                    <span className="small fw-bold text-light uppercase letter-spacing-1">A - I</span>
                                                                </div>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {group1.map(opt => (
                                                                        <Badge
                                                                            key={opt.id}
                                                                            role="button"
                                                                            bg={newModelBrand === opt.name ? "primary" : "secondary"}
                                                                            className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${newModelBrand === opt.name ? 'border-primary' : 'border-dark'}`}
                                                                            style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                            onClick={() => setNewModelBrand(opt.name)}
                                                                        >
                                                                            {opt.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </Col>
                                                            <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                                <div className="text-center mb-1">
                                                                    <span className="small fw-bold text-light uppercase letter-spacing-1">J - R</span>
                                                                </div>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {group2.map(opt => (
                                                                        <Badge
                                                                            key={opt.id}
                                                                            role="button"
                                                                            bg={newModelBrand === opt.name ? "primary" : "secondary"}
                                                                            className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${newModelBrand === opt.name ? 'border-primary' : 'border-dark'}`}
                                                                            style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                            onClick={() => setNewModelBrand(opt.name)}
                                                                        >
                                                                            {opt.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </Col>
                                                            <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                                <div className="text-center mb-1">
                                                                    <span className="small fw-bold text-light uppercase letter-spacing-1">S - Z</span>
                                                                </div>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {group3.map(opt => (
                                                                        <Badge
                                                                            key={opt.id}
                                                                            role="button"
                                                                            bg={newModelBrand === opt.name ? "primary" : "secondary"}
                                                                            className={`p-2 border cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm ${newModelBrand === opt.name ? 'border-primary' : 'border-dark'}`}
                                                                            style={{ minWidth: "46%", transition: 'all 0.2s' }}
                                                                            onClick={() => setNewModelBrand(opt.name)}
                                                                        >
                                                                            {opt.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {newModelBrand && (
                                        <div className="mb-2">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-2">2. Enter Model Name *</Form.Label>
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control
                                                    type="text"
                                                    className="input-contrast p-3 border-0 fw-bold"
                                                    value={newModelName}
                                                    onChange={e => setNewModelName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddBoardModel()}
                                                    placeholder="e.g. Hurricane Ninja"
                                                />
                                                <Button
                                                    variant="success"
                                                    className="fw-bold px-4 px-md-5 border-0"
                                                    onClick={handleAddBoardModel}
                                                    disabled={!newModelName.trim() || isLoading}
                                                >
                                                    {isLoading ? <Spinner animation="border" size="sm" /> : 'Save Model'}
                                                </Button>
                                            </InputGroup>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXISTING MODELS LIST */}
                            {!showAddModel && isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : !showAddModel && (
                                <div className="d-flex flex-column gap-4">
                                    {groupedBoardModels.groups.map(group => (
                                        <div key={group.brand} className="bg-black p-4 rounded border border-secondary shadow-inner">
                                            <h6 className="text-white fw-bold uppercase letter-spacing-1 mb-3 opacity-75">{group.brand}</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {group.models.map((model: any) => (
                                                    <Badge
                                                        key={model.id}
                                                        pill
                                                        bg={editBoardModelOld === model.name ? "primary" : "secondary"}
                                                        className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${editBoardModelOld === model.name ? 'border-primary' : 'border-dark'}`}
                                                        onClick={() => { setEditBoardModelOld(model.name); setEditBoardModelNew(model.name); }}
                                                    >
                                                        {model.name}
                                                        {allActiveParts.some(p => p.model_id === model.id && p.needs_model_review) && <span title="Needs Review" className="ms-1">🚩</span>}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {groupedBoardModels.orphans.length > 0 && (
                                        <div className="bg-black p-4 rounded border border-secondary shadow-inner mt-1">
                                            <h6 className="text-warning fw-bold uppercase letter-spacing-1 mb-3 opacity-75">Uncategorized / No Platform</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {groupedBoardModels.orphans.map(model => (
                                                    <Badge
                                                        key={model}
                                                        pill
                                                        bg={editBoardModelOld === model ? "warning" : "secondary"}
                                                        text={editBoardModelOld === model ? "dark" : "light"}
                                                        className={`px-3 py-2 d-flex align-items-center gap-2 template-badge cursor-pointer border ${editBoardModelOld === model ? 'border-warning' : 'border-dark'}`}
                                                        onClick={() => { setEditBoardModelOld(model); setEditBoardModelNew(model); }}
                                                    >
                                                        {model}
                                                        {allActiveParts.some(p => p.board_model === model && p.needs_model_review) && <span title="Needs Review" className="ms-1">🚩</span>}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {models.length === 0 && (
                                        <div className="bg-black p-5 rounded border border-secondary text-center text-muted small shadow-inner">
                                            No board models found in the database.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EDIT SELECTED MODEL */}
                            {!showAddModel && editBoardModelOld && (
                                <div className="mt-4 p-4 bg-secondary border border-secondary rounded shadow-sm">
                                    <h6 className="text-info fw-bold mb-3">Modify Model Name: <span className="text-white">{editBoardModelOld}</span></h6>

                                    <div className="d-flex flex-column gap-3">
                                        <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                            <Form.Control
                                                type="text"
                                                className="input-contrast p-3 border-0"
                                                value={editBoardModelNew}
                                                onChange={e => setEditBoardModelNew(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleUpdateBoardModel()}
                                                placeholder="Clear this text to remove model from all parts"
                                            />
                                            <Button
                                                variant="success"
                                                className="fw-bold px-4 border-0"
                                                onClick={handleUpdateBoardModel}
                                                disabled={editBoardModelNew === editBoardModelOld || isLoading}
                                            >
                                                {isLoading ? <Spinner animation="border" size="sm" /> : 'Apply to All Parts'}
                                            </Button>
                                        </InputGroup>
                                        <div className="d-flex justify-content-between">
                                            <Button variant="secondary" size="sm" className="fw-bold" onClick={() => { setEditBoardModelOld(""); setEditBoardModelNew(""); }}>Cancel Edit</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab>

                    {/* 8. Hidden */}
                    <Tab eventKey="hidden" title={`8. Hidden (${hiddenParts.length})`}>
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-info fw-bold mb-0">Hidden Vault</h5>
                            </div>
                            <p className="text-muted small mb-4">These parts are soft-hidden via the <code className="text-white">is_hidden</code> flag and do not appear on the public site.</p>

                            {isHiddenLoading ? (
                                <Row>
                                    {[1, 2, 3, 4].map(i => (
                                        <Col key={`skel-${i}`} xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                                            <Card className="h-100 shadow-sm border-secondary bg-black" style={{ minHeight: '300px' }}>
                                                <div className="card-img-holder placeholder-glow bg-secondary" style={{ aspectRatio: "16 / 9", opacity: 0.1 }}>
                                                    <div className="placeholder w-100 h-100"></div>
                                                </div>
                                                <Card.Body className="d-flex flex-column gap-2 p-3">
                                                    <div className="placeholder-glow"><span className="placeholder col-8 bg-secondary"></span></div>
                                                    <div className="placeholder-glow"><span className="placeholder col-4 bg-secondary"></span></div>
                                                    <div className="mt-auto pt-3 placeholder-glow d-flex gap-2">
                                                        <span className="placeholder col-12 bg-secondary py-3 rounded"></span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : hiddenParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No hidden parts found.
                                </div>
                            ) : (
                                <Row>
                                    {hiddenParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <>
                                                <Button variant="outline-success" size="sm" className="w-50 fw-bold" onClick={() => handleRestorePart(part.id!, 'hidden')} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Restore'}
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="w-50 fw-bold" onClick={() => handleSoftDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Delete'}
                                                </Button>
                                            </>
                                        } />
                                    ))}
                                </Row>
                            )}
                        </div>
                    </Tab>

                    {/* 9. Recently Deleted */}
                    <Tab eventKey="deleted" title={`9. Recently Deleted (${deletedParts.length})`}>
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-danger fw-bold mb-0">Trash Bin</h5>
                            </div>
                            <p className="text-muted small mb-4">These parts are soft-deleted and will be permanently removed eventually.</p>

                            {isDeletedLoading ? (
                                <Row>
                                    {[1, 2, 3, 4].map(i => (
                                        <Col key={`skel-del-${i}`} xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                                            <Card className="h-100 shadow-sm border-secondary bg-black" style={{ minHeight: '300px' }}>
                                                <div className="card-img-holder placeholder-glow bg-secondary" style={{ aspectRatio: "16 / 9", opacity: 0.1 }}>
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
                            ) : deletedParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No deleted parts found.
                                </div>
                            ) : (
                                <Row>
                                    {deletedParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <>
                                                <Button variant="outline-success" size="sm" className="w-50 fw-bold" onClick={() => handleRestorePart(part.id!, 'deleted')} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Restore'}
                                                </Button>
                                                <Button variant="danger" size="sm" className="w-50 fw-bold" onClick={() => handlePermDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Perm Delete'}
                                                </Button>
                                            </>
                                        } />
                                    ))}
                                </Row>
                            )}
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
                        <Modal.Body className="bg-dark text-light border-0 px-4 py-4">
                            {/* Image Preview - Absolute Top */}
                            {(() => {
                                const imgSrc = Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : editingPart.image_src;
                                return (
                                    <div className="mb-4 bg-black rounded border border-secondary position-relative shadow-inner overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '100%', minHeight: imgSrc ? '250px' : '150px' }}>
                                        {imgSrc ? (
                                            <>
                                                <img
                                                    src={imgSrc}
                                                    alt="Preview"
                                                    className="w-100 h-100 p-2"
                                                    style={{ objectFit: 'contain', maxHeight: '350px', position: 'absolute', top: 0, left: 0 }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fb = e.currentTarget.parentElement?.querySelector('.fallback-img');
                                                        if (fb) fb.classList.remove('d-none');
                                                    }}
                                                />
                                                <div className="fallback-img d-none position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted small">
                                                    <div className="placeholder-glow w-100 d-flex justify-content-center mb-2">
                                                        <div className="placeholder bg-secondary rounded" style={{ width: "100px", height: "80px", opacity: 0.2 }}></div>
                                                    </div>
                                                    Broken Image URL
                                                </div>
                                            </>
                                        ) : (
                                            <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted small">
                                                <div className="placeholder-glow w-100 d-flex justify-content-center mb-2">
                                                    <div className="placeholder bg-secondary rounded" style={{ width: "100px", height: "80px", opacity: 0.2 }}></div>
                                                </div>
                                                No Image Available
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Image URL</Form.Label>
                                <Form.Control type="text" value={Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : (editingPart.image_src || '')} onChange={e => setEditingPart({ ...editingPart, image_src: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Title *</Form.Label>
                                <Form.Control type="text" value={editingPart.title || ''} onChange={e => setEditingPart({ ...editingPart, title: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Project Link (cad_link) *</Form.Label>
                                <Form.Control type="text" value={editingPart.external_url || ''} onChange={e => setEditingPart({ ...editingPart, external_url: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Mirror Link (Optional)</Form.Label>
                                <Form.Control type="text" value={editingPart.dropbox_url || ''} onChange={e => setEditingPart({ ...editingPart, dropbox_url: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm" placeholder="Dropbox, Google Drive, etc." />
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
                                const pinnedStreet = brands.find(p => p.name === "Street (DIY/Generic)");
                                const pinnedOffroad = brands.find(p => p.name === "Off-Road (DIY/Generic)");
                                const pinnedMisc = brands.find(p => p.name === "Misc" || p.name === "Miscellaneous");

                                const others = brands.filter(p => p.name !== "Street (DIY/Generic)" && p.name !== "Off-Road (DIY/Generic)" && p.name !== "Misc" && p.name !== "Miscellaneous");
                                const group1 = others.filter(p => { const first = p.name[0].toUpperCase(); return (first >= '0' && first <= '9') || (first >= 'A' && first <= 'I'); });
                                const group2 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
                                const group3 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

                                return (
                                    <>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-3">Manufacturer (Platform) *</Form.Label>
                                            <div className="bg-black p-4 rounded border border-secondary shadow-inner">
                                                <Row className="g-3 mb-4">
                                                    <Col xs={12} lg={4}>
                                                        {pinnedStreet && (
                                                            <Badge
                                                                bg={editingPart.platform_id === pinnedStreet.id ? "primary" : "none"}
                                                                className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                                style={{ fontSize: "0.85rem" }}
                                                                onClick={() => setEditingPart({ ...editingPart, platform_id: pinnedStreet.id })}
                                                            >
                                                                {pinnedStreet.name}
                                                            </Badge>
                                                        )}
                                                    </Col>
                                                    <Col xs={12} lg={4}>
                                                        {pinnedOffroad && (
                                                            <Badge
                                                                bg={editingPart.platform_id === pinnedOffroad.id ? "primary" : "none"}
                                                                className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                                style={{ fontSize: "0.85rem" }}
                                                                onClick={() => setEditingPart({ ...editingPart, platform_id: pinnedOffroad.id })}
                                                            >
                                                                {pinnedOffroad.name}
                                                            </Badge>
                                                        )}
                                                    </Col>
                                                    <Col xs={12} lg={4}>
                                                        {pinnedMisc && (
                                                            <Badge
                                                                bg={editingPart.platform_id === pinnedMisc.id ? "primary" : "none"}
                                                                className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                                style={{ fontSize: "0.85rem" }}
                                                                onClick={() => setEditingPart({ ...editingPart, platform_id: pinnedMisc.id })}
                                                            >
                                                                {pinnedMisc.name}
                                                            </Badge>
                                                        )}
                                                    </Col>
                                                </Row>

                                                <h3 className="h6 fw-bold text-light mb-3 uppercase letter-spacing-1 border-bottom border-secondary pb-2 text-center">Brands</h3>

                                                <Row className="g-4">
                                                    <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                        <div className="text-center mb-1">
                                                            <span className="small fw-bold text-light uppercase letter-spacing-1">A - I</span>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {group1.map(opt => (
                                                                <Badge key={opt.id} role="button" bg={editingPart.platform_id === opt.id ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => setEditingPart({ ...editingPart, platform_id: opt.id })}>
                                                                    {opt.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </Col>
                                                    <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                        <div className="text-center mb-1">
                                                            <span className="small fw-bold text-light uppercase letter-spacing-1">J - R</span>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {group2.map(opt => (
                                                                <Badge key={opt.id} role="button" bg={editingPart.platform_id === opt.id ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => setEditingPart({ ...editingPart, platform_id: opt.id })}>
                                                                    {opt.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </Col>
                                                    <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                                        <div className="text-center mb-1">
                                                            <span className="small fw-bold text-light uppercase letter-spacing-1">S - Z</span>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {group3.map(opt => (
                                                                <Badge key={opt.id} role="button" bg={editingPart.platform_id === opt.id ? "primary" : "none"} className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm" style={{ minWidth: "46%" }} onClick={() => setEditingPart({ ...editingPart, platform_id: opt.id })}>
                                                                    {opt.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Category *</Form.Label>
                                            <div className="d-flex flex-wrap gap-2 p-4 bg-black rounded border border-secondary shadow-inner">
                                                {partCategories.map(c => {
                                                    const isSelected = editingPart.category_id === c.id;
                                                    return (
                                                        <Badge
                                                            key={c.id}
                                                            role="button"
                                                            bg={isSelected ? "primary" : "none"}
                                                            className="border border-light p-2 cursor-pointer shadow-sm text-wrap lh-sm"
                                                            onClick={() => setEditingPart({ ...editingPart, category_id: c.id })}
                                                        >
                                                            {c.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Fabrication Method *</Form.Label>
                                            <div className="d-flex flex-wrap gap-2 p-4 bg-black rounded border border-secondary shadow-inner">
                                                {fabricationMethods.map(c => {
                                                    const isSelected = editingPart.fabrication_method_id === c.id;
                                                    return (
                                                        <Badge
                                                            key={c.id}
                                                            role="button"
                                                            bg={isSelected ? "primary" : "none"}
                                                            className="border border-light p-2 cursor-pointer shadow-sm text-wrap lh-sm"
                                                            onClick={() => setEditingPart({ ...editingPart, fabrication_method_id: c.id })}
                                                        >
                                                            {c.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </Form.Group>

                                        {/* Tags Summary Pills Section */}
                                        <div className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Selection Summary (Tags)</Form.Label>
                                            <div className="mt-2 p-3 rounded-pill bg-black border border-secondary d-flex align-items-center justify-content-center gap-2 flex-wrap shadow-inner" style={{ minHeight: '52px' }}>
                                                {editingPart.platform_id && (
                                                    <Badge pill bg="dark" className="border border-info text-info py-2 px-3">
                                                        {brands.find(b => b.id === editingPart.platform_id)?.name || "Unknown Platform"}
                                                    </Badge>
                                                )}
                                                {editingPart.category_id && (
                                                    <Badge pill bg="dark" className="border border-info text-info py-2 px-3">
                                                        {partCategories.find(c => c.id === editingPart.category_id)?.name || "Unknown Category"}
                                                    </Badge>
                                                )}
                                                {editingPart.fabrication_method_id && (
                                                    <Badge pill bg="dark" className="border border-info text-info py-2 px-3">
                                                        {fabricationMethods.find(f => f.id === editingPart.fabrication_method_id)?.name || "Unknown Method"}
                                                    </Badge>
                                                )}
                                                {editingPart.is_oem && (
                                                    <Badge pill bg="none" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }} className="border py-2 px-3">OEM</Badge>
                                                )}
                                                {((editingPart as any).models?.name || editingPart.model_id) && (
                                                    <Badge pill bg="warning" text="dark" className="border border-warning py-2 px-3">
                                                        {(editingPart as any).models?.name || (models.find(m => m.id === editingPart.model_id)?.name) || editingPart.model_id}
                                                    </Badge>
                                                )}
                                                {!editingPart.model_id && !(editingPart as any).models?.name && editingPart.board_model && (
                                                    <Badge pill bg="secondary" text="light" className="border border-dark py-2 px-3">
                                                        {editingPart.board_model}
                                                    </Badge>
                                                )}
                                                {!editingPart.platform_id && !editingPart.category_id && !editingPart.fabrication_method_id && !editingPart.is_oem && !editingPart.model_id && !editingPart.board_model && (
                                                    <span className="small text-muted opacity-50 italic">No tags selected yet...</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            <Row className="mb-4">
                                <Col md={12} className="d-flex align-items-center">
                                    <Form.Check type="checkbox" id="edit-oem" label="OEM PART" checked={editingPart.is_oem || false} onChange={e => setEditingPart({ ...editingPart, is_oem: e.target.checked })} className="fw-bold text-primary mt-1" />
                                </Col>
                            </Row>

                            <HardwareFields
                                brandId={editingPart.platform_id || null}
                                modelId={editingPart.model_id || editingPart.board_model || null}
                                needsModelReview={editingPart.needs_model_review || false}
                                onChangeModel={(m) => setEditingPart(prev => prev ? { ...prev, model_id: m } : null)}
                                onChangeNeedsReview={(b) => setEditingPart(prev => prev ? { ...prev, needs_model_review: b } : null)}
                            />
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
