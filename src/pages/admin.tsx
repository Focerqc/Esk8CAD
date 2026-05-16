import { useNavigate, useParams } from "react-router-dom"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Alert, Spinner, Tabs, Tab, Row, Col, Badge, Stack, InputGroup, Modal } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import HardwareFields from "../components/Forms/HardwareFields"
import SharedAttributeEditor from "../components/Forms/SharedAttributeEditor"
import { getSupabaseClient, Part, Brand, Model } from "../lib/supabase"
import { SupabaseClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useBoardHook } from "../hooks/useBoardHook"

interface CategoryTemplateField {
    key: string;
    type: 'text' | 'dimension';
    unit?: string;
    placeholder?: string;
    diagram_url?: string;
    is_primary?: boolean;
    is_bearing?: boolean;
}

interface Taxonomy {
    id: string;
    name: string;
    template_fields?: CategoryTemplateField[];
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
                            <Card.Title as="h5" className="mb-1 fw-bold text-white text-truncate" title={part.title} style={{ minWidth: 0 }}>
                                {part.needs_model_review && <span className="me-2" title="Needs Model Review">🚩</span>}
                                {part.title}
                            </Card.Title>
                        </div>
                        <Card.Subtitle className="mb-3 small">
                            <span className="text-gray-400">By: {author}</span>
                        </Card.Subtitle>

                        <div className="mb-3">
                            <span className="text-info fw-bold small me-2 d-block mb-2 text-uppercase letter-spacing-1" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'visible' }}>
                                {(part as any).brands?.name || (part.platform && part.platform.length > 0 ? part.platform[0] : "No Platform")}
                            </span>
                            <div className="d-flex flex-wrap gap-1">
                                {(part as any).hardware_models?.name && (
                                    <Badge bg="primary" className="border border-primary py-1 px-1 rounded-md shadow-sm">
                                        {(part as any).hardware_models?.name}
                                    </Badge>
                                )}
                                {part.board_model && !((part as any).hardware_models?.name) && (
                                    <Badge bg="warning" text="dark" className="border border-dark py-1 px-1 rounded-md" title="Pending Model Creation">
                                        🚩 {part.board_model}
                                    </Badge>
                                )}
                                {(part as any).part_categories?.name && (
                                    <Badge bg="secondary" className="border border-secondary py-1 px-1 rounded-md">
                                        {(part as any).part_categories?.name}
                                    </Badge>
                                )}
                                {(part as any).fabrication_methods?.name && (
                                    <Badge bg="dark" className="border border-secondary py-1 px-1 rounded-md text-info">
                                        {(part as any).fabrication_methods?.name}
                                    </Badge>
                                )}
                                {part.is_oem && (
                                    <Badge bg="none" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }} className="border py-1 px-1 rounded-md">
                                        OEM
                                    </Badge>
                                )}
                            </div>

                            {/* Dynamic Specifications (JSONB) */}
                            {part.attributes && Object.keys(part.attributes).length > 0 && (
                                <div className="d-flex flex-wrap gap-2 text-xs text-gray-400 mt-3">
                                    {Object.entries(part.attributes || {}).filter(([k]) => !k.endsWith('__unit')).slice(0, 4).map(([key, value]) => {
                                        const unit = (part.attributes as any)[`${key}__unit`] || '';
                                        return (
                                            <span key={key} className="bg-slate-800/50 px-2 py-1 rounded">
                                                {key}: {String(value)} {unit}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
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

export default function AdminPage() {
    console.log("Admin Page Loaded");
    const navigate = useNavigate();
    const { tab: urlTab } = useParams();
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
    
    // Category Template State
    const [newTemplateKey, setNewTemplateKey] = useState("");
    const [newTemplateType, setNewTemplateType] = useState<'text' | 'dimension'>("dimension");
    const [newTemplateUnit, setNewTemplateUnit] = useState("");
    const [newTemplatePlaceholder, setNewTemplatePlaceholder] = useState("");
    const [newTemplateDiagramUrl, setNewTemplateDiagramUrl] = useState("");
    const [newTemplateIsPrimary, setNewTemplateIsPrimary] = useState(false);
    const [newTemplateIsBearing, setNewTemplateIsBearing] = useState(false);
    const [editingTemplateFieldIndex, setEditingTemplateFieldIndex] = useState<number | null>(null);

    // Tab 6 & 7 Refactor States
    const [editingBrandAdmin, setEditingBrandAdmin] = useState<Brand | null>(null);
    const [editBrandName, setEditBrandName] = useState("");
    const [editBrandOverview, setEditBrandOverview] = useState("");
    const [editBrandImage, setEditBrandImage] = useState<string | null>(null);

    const [selectedModelPlatform, setSelectedModelPlatform] = useState<string | null>(null);
    const [isBrandSaving, setIsBrandSaving] = useState(false);

    const [editingModelAdmin, setEditingModelAdmin] = useState<any | null>(null);
    const [editModelName, setEditModelName] = useState("");
    const [editModelDesc, setEditModelDesc] = useState("");
    const [editModelImage, setEditModelImage] = useState<string | null>(null);
    const [isModelSaving, setIsModelSaving] = useState(false);

    const {
        special: specialPlatformsData,
        groupedBrands: alphabeticalBrandsData,
        groupedModels,
        brands,
        models,
        loading: isBoardLoading,
        refresh: refreshBoardData
    } = useBoardHook();

    // Audit State
    const [missingBrands, setMissingBrands] = useState<Brand[]>([]);
    const [missingModels, setMissingModels] = useState<any[]>([]);
    const [missingAttributes, setMissingAttributes] = useState<{ categoryName: string, fieldKey: string }[]>([]);
    const [isAuditLoading, setIsAuditLoading] = useState(false);
    const [isUploadingDiagram, setIsUploadingDiagram] = useState(false);

    const [isActionLoading, setIsActionLoading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isHiddenLoading, setIsHiddenLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [registrySearchText, setRegistrySearchText] = useState("");
    const [selectedAttributeCategory, setSelectedAttributeCategory] = useState<string>("all");
    const [attributeZoomedFields, setAttributeZoomedFields] = useState<Record<string, boolean>>({});
    const [attributeDimensionUnits, setAttributeDimensionUnits] = useState<Record<string, string>>({});
    
    // Attribute Merge Modal State
    const [showAttributeMergeModal, setShowAttributeMergeModal] = useState(false);
    const [targetAttributeKey, setTargetAttributeKey] = useState("");
    const [newAttributeKey, setNewAttributeKey] = useState("");
    const [isMergingAttributes, setIsMergingAttributes] = useState(false);
    const [activeAttributeFilter, setActiveAttributeFilter] = useState<string | null>(null);
    const [isLandscape, setIsLandscape] = useState(false);

    // Detect Tab from URL
    const [activeTab, setActiveTab] = useState('queue');
    const handleTabSelect = (k: string | null) => {
        if (k) {
            setActiveTab(k);
            navigate(`/admin/${k}`, { replace: true });
        }
    };

    // Sync tab from URL params
    useEffect(() => {
        if (urlTab) {
            setActiveTab(urlTab);
        }
    }, [urlTab]);

    // Sync units from JSONB when entering edit mode
    useEffect(() => {
        if (editingPart && editingPart.attributes) {
            const units: Record<string, string> = {};
            Object.entries(editingPart.attributes).forEach(([k, v]) => {
                if (k.endsWith('__unit')) {
                    const key = k.replace('__unit', '');
                    units[key] = v as string;
                }
            });
            setAttributeDimensionUnits(units);
        } else {
            // Only clear when fully closing modal
            if (!editingPart) {
                setAttributeDimensionUnits({});
                setAttributeZoomedFields({});
            }
        }
    }, [editingPart]);

    // Sync Page Title to internal Navigation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.title = `/admin/${activeTab}`;
        }
    }, [activeTab]);

    // Default Attribute Category selection
    useEffect(() => {
        if (partCategories.length > 0 && !selectedAttributeCategory) {
            setSelectedAttributeCategory("all");
        }
    }, [partCategories, selectedAttributeCategory]);

    const fetchAuditData = async () => {
        if (!supabase) return;
        setIsAuditLoading(true);
        try {
            // 1. Brands missing description or image
            const { data: bData } = await supabase
                .from('brands')
                .select('*')
                .or('description.is.null,image_url.is.null')
                .order('name');
            setMissingBrands(bData || []);

            // 2. Models missing description or image
            const { data: mData } = await supabase
                .from('models')
                .select('*, brands(name)')
                .or('description.is.null,image_url.is.null')
                .order('name');
            setMissingModels(mData || []);

            // 3. Attributes missing diagrams
            const missingAttrs: { categoryName: string, fieldKey: string }[] = [];
            partCategories.forEach(cat => {
                if (cat.template_fields) {
                    cat.template_fields.forEach((tf: any) => {
                        if (!tf.diagram_url) {
                            missingAttrs.push({
                                categoryName: cat.name,
                                fieldKey: tf.key
                            });
                        }
                    });
                }
            });
            setMissingAttributes(missingAttrs);

        } catch (err: any) {
            console.error("Audit fetch failed", err);
        } finally {
            setIsAuditLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'missing' && user) {
            fetchAuditData();
        }
    }, [activeTab, user]);


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
                attributes: editingPart.attributes || null,
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
    const trulyHiddenParts = hiddenParts.filter(p => p.status !== 'pending');

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

    // Identify models that exist as strings but not in the registry
    const ghostModels = useMemo(() => {
        const ghostMap = new Map<string, { brand_id: string, brand_name: string, model_name: string, part_ids: string[] }>();
        allActiveParts.forEach(p => {
            if (p.board_model && !p.model_id) {
                const key = `${p.platform_id || 'unknown'}:${p.board_model.trim().toLowerCase()}`;
                if (!ghostMap.has(key)) {
                    const brand = brands.find(b => b.id === p.platform_id);
                    ghostMap.set(key, {
                        brand_id: p.platform_id || 'unknown',
                        brand_name: brand ? brand.name : "Unknown Brand",
                        model_name: p.board_model.trim(),
                        part_ids: []
                    });
                }
                ghostMap.get(key)!.part_ids.push(p.id!);
            }
        });
        return Array.from(ghostMap.values()).sort((a, b) => a.brand_name.localeCompare(b.brand_name) || a.model_name.localeCompare(b.model_name));
    }, [allActiveParts, brands]);

    // Attribute Dictionary Aggregation
    const attributeDictionary = useMemo(() => {
        if (!selectedAttributeCategory) return [];
        const counts: Record<string, number> = {};
        const allParts = [...parts, ...hiddenParts, ...deletedParts].filter(p => 
            selectedAttributeCategory === 'all' || p.category_id === selectedAttributeCategory
        );
        
        allParts.forEach(p => {
            if (p.attributes && typeof p.attributes === 'object') {
                Object.keys(p.attributes).forEach(key => {
                    if (!key.endsWith('__unit')) {
                        counts[key] = (counts[key] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(counts)
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    }, [parts, hiddenParts, deletedParts, selectedAttributeCategory]);

    const handlePurgeAttribute = async (key: string) => {
        if (!selectedAttributeCategory || !supabase) return;
        if (!window.confirm(`Permanently remove "${key}" from ALL parts in the ${selectedAttributeCategory === 'all' ? 'entire database' : 'selected category'}? This cannot be undone.`)) return;

        setIsMergingAttributes(true);
        try {
            let query = supabase.from('parts').select('id, attributes');
            if (selectedAttributeCategory !== 'all') {
                query = query.eq('category_id', selectedAttributeCategory);
            }
            
            const { data: partsWithAttr, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const targets = (partsWithAttr as any[]).filter(p => p.attributes && (p.attributes[key] !== undefined || p.attributes[`${key}__unit`] !== undefined));

            if (targets.length === 0) {
                alert("No parts found containing this attribute.");
                return;
            }

            for (const part of targets) {
                const newAttrs = { ...part.attributes };
                delete newAttrs[key];
                delete newAttrs[`${key}__unit`];
                
                const { error: upError } = await supabase.from('parts').update({ attributes: newAttrs }).eq('id', part.id);
                if (upError) console.error(`Failed to update part ${part.id}`, upError);
            }

            alert(`Successfully purged "${key}" from ${targets.length} parts.`);
            fetchData();
            fetchHiddenData();
        } catch (err: any) {
            alert(`Purge failed: ${err.message}`);
        } finally {
            setIsMergingAttributes(false);
        }
    };

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
                    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                    if (!adminEmail) {
                        if (import.meta.env.DEV) console.warn("VITE_ADMIN_EMAIL is missing from environment. Admin access disabled.");
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
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                if (!adminEmail) {
                    if (import.meta.env.DEV) console.warn("VITE_ADMIN_EMAIL is missing from environment. Admin access disabled.");
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
                .select('*, brands(name), part_categories(name), fabrication_methods(name), hardware_models:model_id(name)')
                .eq('is_hidden', false)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (pError) throw pError;
            setParts((pData as any[]) || []);

            const { data: cData } = await supabase.from('fabrication_methods').select('*').order('name');
            if (cData) setFabricationMethods(cData);

            const { data: catData } = await supabase.from('part_categories').select('*').order('name');
            if (catData) setPartCategories(catData);


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
                .select('*, brands(name), part_categories(name), fabrication_methods(name), hardware_models:model_id(name)')
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
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            if (!adminEmail) {
                if (import.meta.env.DEV) console.warn("VITE_ADMIN_EMAIL is missing from environment. Admin access disabled.");
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
            // Check if this part has a custom board model that needs creation
            const part = pendingParts.find(p => p.id === id) || parts.find(p => p.id === id);
            let updatePayload: any = { status: 'approved', is_hidden: false, needs_model_review: false };

            if (part && part.board_model && part.needs_model_review && part.platform_id) {
                // Try to create the model in the models table first
                const brandObj = brands.find(b => b.id === part.platform_id);
                const brandPrefix = brandObj ? `${brandObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-` : '';
                const modelSlug = `${brandPrefix}${generateSlug(part.board_model)}`;

                const { data: newModel, error: modelError } = await supabase
                    .from('models')
                    .insert([{
                        name: part.board_model.trim(),
                        brand_id: part.platform_id,
                        slug: modelSlug
                    }])
                    .select()
                    .single();

                if (!modelError && newModel) {
                    updatePayload.model_id = newModel.id;
                    updatePayload.board_model = null; // Clear legacy string
                    refreshBoardData();
                } else {
                    console.error("Auto-model creation failed during approval:", modelError);
                    if (modelError?.code === '23505') {
                        setError(`Conflict: A model with the slug "${modelSlug}" already exists. Please manually link or rename.`);
                        setActionLoadingId(null);
                        return;
                    }
                    // We'll still allow manual approval if it's just a generic error, but notify
                    setError("Auto-model creation failed: " + (modelError?.message || "Check console"));
                }
            }

            const { error: sbError } = await supabase.from('parts').update(updatePayload).eq('id', id);
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
            const payload = { 
                name: editPartCategoryName.trim(),
                template_fields: selectedPartCategory.template_fields || [] 
            };
            const { error: sbError } = await supabase.from('part_categories').update(payload).eq('id', selectedPartCategory.id);
            if (sbError) throw sbError;
            setPartCategories(prev => prev.map(c => c.id === selectedPartCategory.id ? { ...c, ...payload } : c).sort((a, b) => a.name.localeCompare(b.name)));
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

    const handleAddTemplateField = () => {
        if (!newTemplateKey.trim()) return;
        const newField: CategoryTemplateField = {
            key: newTemplateKey.trim(),
            type: newTemplateType,
            unit: newTemplateUnit.trim() || undefined,
            placeholder: newTemplatePlaceholder.trim() || undefined,
            diagram_url: newTemplateDiagramUrl.trim() || undefined,
            is_primary: newTemplateIsPrimary,
            is_bearing: newTemplateIsBearing
        };
        
        if (selectedPartCategory) {
            const updatedFields = [...(selectedPartCategory.template_fields || [])];
            if (editingTemplateFieldIndex !== null) {
                updatedFields[editingTemplateFieldIndex] = newField;
            } else {
                updatedFields.push(newField);
            }
            setSelectedPartCategory({ ...selectedPartCategory, template_fields: updatedFields });
            // Reset form
            setNewTemplateKey("");
            setNewTemplateType("dimension");
            setNewTemplateUnit("");
            setNewTemplatePlaceholder("");
            setNewTemplateDiagramUrl("");
            setNewTemplateIsPrimary(false);
            setNewTemplateIsBearing(false);
            setEditingTemplateFieldIndex(null);
        }
    };

    const handleDiagramUpload = async (file: File) => {
        if (!supabase) return;
        setIsUploadingDiagram(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `attributes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(filePath);

            setNewTemplateDiagramUrl(publicUrl);
        } catch (err: any) {
            setError('Diagram upload failed: ' + (err.message || String(err)));
        } finally {
            setIsUploadingDiagram(false);
        }
    };

    const handleEditTemplateField = (index: number) => {
        if (selectedPartCategory && selectedPartCategory.template_fields) {
            const field = selectedPartCategory.template_fields[index];
            setNewTemplateKey(field.key);
            setNewTemplateType(field.type);
            setNewTemplateUnit(field.unit || "");
            setNewTemplatePlaceholder(field.placeholder || "");
            setNewTemplateDiagramUrl(field.diagram_url || "");
            setNewTemplateIsPrimary(!!field.is_primary);
            setNewTemplateIsBearing(!!field.is_bearing);
            setEditingTemplateFieldIndex(index);
        }
    };

    const handleCancelTemplateEdit = () => {
        setNewTemplateKey("");
        setNewTemplateType("dimension");
        setNewTemplateUnit("");
        setNewTemplatePlaceholder("");
        setNewTemplateDiagramUrl("");
        setNewTemplateIsPrimary(false);
        setNewTemplateIsBearing(false);
        setEditingTemplateFieldIndex(null);
    };

    const handleRemoveTemplateField = (index: number) => {
        if (selectedPartCategory && selectedPartCategory.template_fields) {
            const updatedFields = selectedPartCategory.template_fields.filter((_, i) => i !== index);
            setSelectedPartCategory({ ...selectedPartCategory, template_fields: updatedFields });
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
                refreshBoardData();
                setNewPlatform('');
            }
        } catch (err: any) {
            setError('Failed to add platform: ' + (err.message || String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDeletePlatform = async () => {
        const target = editingBrandAdmin || selectedPlatform;
        if (!target || !supabase) return;
        setIsLoading(true);
        try {
            const id = target.id;
            const { error: sbError } = await supabase.from('brands').delete().eq('id', id);
            if (sbError) throw sbError;
            refreshBoardData();
            setSelectedPlatform(null);
            setEditingBrandAdmin(null);
            setPlatformDeleteConfirm(false);
        } catch (err: any) {
            setError('Failed to delete platform: ' + (err.message || String(err)));
            fetchData();
        } finally {
            // Cleanup states
        }
    };

    const handleConfirmDeleteModel = async () => {
        if (!editingModelAdmin || !supabase) return;
        setIsModelSaving(true);
        try {
            const id = editingModelAdmin.id;
            const { error: sbError } = await supabase.from('models').delete().eq('id', id);
            if (sbError) throw sbError;
            
            setEditingModelAdmin(null);
            refreshBoardData();
        } catch (err: any) {
            setError('Failed to delete model: ' + (err.message || String(err)));
        } finally {
            setIsModelSaving(false);
        }
    };
    const handleUpdateBrandAdvanced = async () => {
        if (!supabase || !editingBrandAdmin) return;
        setIsBrandSaving(true);
        try {
            const { error: sbError } = await supabase
                .from('brands')
                .update({
                    name: editBrandName.trim(),
                    slug: generateSlug(editBrandName),
                    description: editBrandOverview.trim(),
                    image_url: editBrandImage
                })
                .eq('id', editingBrandAdmin.id);

            if (sbError) throw sbError;
            setEditingBrandAdmin(null);
            refreshBoardData();
        } catch (err: any) {
            setError('Failed to update brand: ' + err.message);
        } finally {
            setIsBrandSaving(false);
        }
    };

    const handleUpdateModelAdvanced = async () => {
        if (!supabase || !editingModelAdmin) return;
        setIsModelSaving(true);
        try {
            // NOTE: models table is currently missing an image column in schema.
            // This update handles name and description.
            const { error: sbError } = await supabase
                .from('models')
                .update({
                    name: editModelName.trim(),
                    description: editModelDesc.trim(),
                    image_url: editModelImage
                })
                .eq('id', editingModelAdmin.id);

            if (sbError) throw sbError;
            setEditingModelAdmin(null);
            refreshBoardData();
        } catch (err: any) {
            setError('Failed to update model: ' + err.message);
        } finally {
            setIsModelSaving(false);
        }
    };

    const handleMergeAttributes = async () => {
        if (!supabase || !targetAttributeKey || !newAttributeKey.trim()) return;
        setIsMergingAttributes(true);
        try {
            const normalizedNewKey = newAttributeKey.trim();
            
            // 1. Get scope of parts to update
            let partsToUpdate = [...parts, ...hiddenParts, ...deletedParts];
            if (selectedAttributeCategory) {
                partsToUpdate = partsToUpdate.filter(p => p.category_id === selectedAttributeCategory);
            }

            // Filter down to only those that actually have the key
            const relevantParts = partsToUpdate.filter(p => p.attributes && (p.attributes as any)[targetAttributeKey] !== undefined);

            if (relevantParts.length === 0) {
                alert("No parts found with this attribute key in the current scope.");
                return;
            }

            // 2. Process updates sequentially
            for (const part of relevantParts) {
                const newAttributes = { ...(part.attributes as any) };
                const value = newAttributes[targetAttributeKey];
                newAttributes[normalizedNewKey] = value;
                delete newAttributes[targetAttributeKey];

                const { error: updateError } = await supabase
                    .from('parts')
                    .update({ attributes: newAttributes })
                    .eq('id', part.id);

                if (updateError) throw updateError;
            }

            // 3. Cleanup and Refresh
            setShowAttributeMergeModal(false);
            setTargetAttributeKey("");
            setNewAttributeKey("");
            // Refresh counts
            fetchData();
            fetchHiddenData();
            fetchDeletedData();
            alert(`Successfully merged '${targetAttributeKey}' into '${normalizedNewKey}' across ${relevantParts.length} parts.`);

        } catch (err: any) {
            setError('Failed to merge attributes: ' + (err.message || String(err)));
        } finally {
            setIsMergingAttributes(false);
        }
    };

    const sanitizeFileName = (fileName: string) => {
        return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    };

    const handleImageUpload = async (type: 'brands' | 'models', id: string, file: File) => {
        if (!file || !supabase) return;
        setIsActionLoading(true);
        console.log(`📡 STARTING NATIVE UPLOAD [${type}]:`, { id, fileName: file.name, size: file.size });

        try {
            const safeFileName = sanitizeFileName(file.name);
            const filePath = `${type}/${id || 'new'}/${Date.now()}_${safeFileName}`;

            // 3. NATIVE UPLOAD
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error("❌ UPLOAD ERROR:", {
                    message: uploadError.message,
                    details: (uploadError as any).details,
                    hint: (uploadError as any).hint
                });
                throw uploadError;
            }

            // 5. GET PUBLIC URL
            const { data: { publicUrl } } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(filePath);

            console.log("✅ Upload Success. Public URL:", publicUrl);

            // 6. SYNC DATABASE
            // Note: We update 'image_url' for brands. For models, the schema may need review, but we'll attempt same column first as per instructions.
            const targetColumn = type === 'brands' ? 'image_url' : 'image_url'; // User specified image_url in step 6
            const { error: dbError } = await supabase
                .from(type)
                .update({ [targetColumn]: publicUrl })
                .eq('id', id);

            if (dbError) {
                console.error(`❌ DB SYNC ERROR [${type}]:`, {
                    message: dbError.message,
                    details: dbError.details,
                    hint: dbError.hint
                });
                // We still update local state so the preview works
            }

            if (type === 'brands') {
                setEditBrandImage(publicUrl);
            } else {
                setEditModelImage(publicUrl);
            }

            await refreshBoardData();
        } catch (err: any) {
            console.error("❌ PIPELINE FAILURE:", err);
            setError('Upload failed: ' + (err.message || String(err)));
        } finally {
            setIsActionLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handlePromoteModel = async (ghost: { brand_id: string, model_name: string, part_ids: string[] }) => {
        if (!supabase) return;
        setIsActionLoading(true);
        try {
            const brandObj = brands.find(b => b.id === ghost.brand_id);
            const brandPrefix = brandObj ? `${brandObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-` : '';
            const slug = `${brandPrefix}${generateSlug(ghost.model_name)}`;

            // 1. Create the model
            const { data: newModel, error: modelError } = await supabase
                .from('models')
                .insert([{
                    name: ghost.model_name,
                    brand_id: ghost.brand_id,
                    slug
                }])
                .select()
                .single();

            if (modelError) throw modelError;

            // 2. Update all parts
            const { error: updateError } = await supabase
                .from('parts')
                .update({
                    model_id: newModel.id,
                    board_model: null,
                    needs_model_review: false
                })
                .in('id', ghost.part_ids);

            if (updateError) throw updateError;

            refreshBoardData();
            fetchData();
            fetchHiddenData();
        } catch (err: any) {
            setError('Failed to promote model: ' + (err.message || String(err)));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddBoardModelWithName = async (brandName: string) => {
        if (!brandName || !newModelName.trim() || !supabase) return;
        setIsLoading(true);
        try {
            // Find the brand object for the selected brand name
            const brandObj = brands.find(b => b.name === brandName);
            if (!brandObj) throw new Error("Selected platform/brand not found.");

            // Create a brand-prefixed slug to avoid cross-brand collisions
            const brandSlug = brandObj.slug || brandObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const modelSlug = generateSlug(newModelName);
            const slug = `${brandSlug}-${modelSlug}`;

            const { error: sbError } = await supabase
                .from('models')
                .insert([{
                    name: newModelName.trim(),
                    brand_id: brandObj.id,
                    slug
                }]);

            if (sbError) throw sbError;

            // Success feedback
            setNewModelName("");
            refreshBoardData();
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
                <SiteNavbar />
                <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Alert variant="danger" className="text-center shadow-lg p-5 w-100" style={{ maxWidth: '600px' }}>
                        <h4 className="fw-bold mb-3">System Configuration Error</h4>
                        <p className="mb-0">
                            The Supabase connection could not be established. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
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
            <SiteMetaData title={`ESK8CAD/Admin${activeTab ? `/${activeTab}` : ''}`} />
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
                .tab-count { font-size: 0.8rem; opacity: 0.7; margin-left: 5px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 10px; }
                
                /* Shared Brand Styles */
                .brand-header-box { background: #0B0E14; border: 1px solid #1a1d20; border-radius: 2rem; overflow: hidden; box-shadow: 0 1rem 3rem rgba(0,0,0,0.5); }
                .featured-model-card { background: rgba(11, 14, 20, 0.5); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 1.5rem; backdrop-filter: blur(10px); }
                .text-tracking-widest { letter-spacing: 0.3em; }
                .fw-black { font-weight: 900; }
                .letter-spacing-1 { letter-spacing: 0.1em; }
                .letter-spacing-2 { letter-spacing: 0.2em; }
                .italic { font-style: italic; }
                .extreme-small { font-size: 0.65rem; }
                
                /* Admin Preview Scaling - Balanced for XL Modal */
                .admin-preview-scaler { transform: scale(1); transform-origin: top center; width: 100%; margin-top: 2rem; }
                @media (max-width: 1400px) { .admin-preview-scaler { transform: scale(0.85); width: 118%; margin: 1rem -9%; } }
                @media (max-width: 1215px) { .admin-preview-scaler { transform: scale(0.7); width: 142%; margin: -6rem -21%; } }
                .animate-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .hover-opacity-75:hover { opacity: 0.75; }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.1); }
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

                <Tabs activeKey={activeTab} onSelect={handleTabSelect} id="admin-tabs" className="mb-5 admin-tabs border-secondary">


                    {/* 1. Review Queue */}
                    <Tab eventKey="queue" title={`1. Review Queue (${pendingParts.length})`}>
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : pendingParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Queue clear. Everything is up to date!
                                </div>
                            ) : (
                                <Row className="g-4">
                                    {pendingParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <>
                                                <Button variant="outline-success" size="sm" className="w-50 fw-bold" onClick={() => handleApprove(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Approve'}
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="w-50 fw-bold" onClick={() => handlePermDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Purge'}
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
                                <div>
                                    <h5 className="text-info fw-bold mb-1">Central Asset Index</h5>
                                </div>
                                <Badge bg="secondary" className="px-3 py-2 border border-secondary shadow-sm">{approvedParts.length} Total Records</Badge>
                            </div>

                            <InputGroup className="mb-4 shadow-sm">
                                <Form.Control
                                    type="text"
                                    placeholder="Live filter by title, author, or id..."
                                    className="input-contrast p-3"
                                    value={registrySearchText}
                                    onChange={e => setRegistrySearchText(e.target.value)}
                                />
                            </InputGroup>

                            {isLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : (
                                <>
                                    {activeAttributeFilter && (
                                        <Alert variant="info" className="d-flex justify-content-between align-items-center py-2 px-3 mb-4 bg-dark border-info text-info shadow-sm animate-in fade-in">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="small uppercase fw-bold opacity-75">Filtered by Attribute:</span>
                                                <Badge bg="info" text="dark" className="px-2 py-1">{activeAttributeFilter}</Badge>
                                            </div>
                                            <Button 
                                                variant="link" 
                                                className="text-info p-0 text-decoration-none fw-bold hover-scale" 
                                                style={{ fontSize: '1.2rem', lineHeight: 1 }}
                                                onClick={() => setActiveAttributeFilter(null)}
                                                title="Clear Filter"
                                            >
                                                &times;
                                            </Button>
                                        </Alert>
                                    )}

                                    {approvedParts
                                        .filter(p => (p.title + (p.author || '') + p.id).toLowerCase().includes(registrySearchText.toLowerCase()))
                                        .filter(p => !activeAttributeFilter || (p.attributes && Object.keys(p.attributes).includes(activeAttributeFilter)))
                                        .length === 0 ? (
                                        <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            No records found matching your current filters.
                                        </div>
                                    ) : (
                                        <Row className="g-4">
                                            {approvedParts
                                                .filter(p => (p.title + (p.author || '') + p.id).toLowerCase().includes(registrySearchText.toLowerCase()))
                                                .filter(p => !activeAttributeFilter || (p.attributes && Object.keys(p.attributes).includes(activeAttributeFilter)))
                                                .map(part => (
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
                                </>
                            )}
                        </div>
                    </Tab>

                    {/* 4. Part Categories */}
                    <Tab eventKey="categories" title="4. Part Categories">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Terminology & Tags</h5>
                            <p className="text-muted small mb-4">Add or remove part categories globally.</p>

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
                                                <strong>Confirm Deletion:</strong> Are you sure? Deleting <span className="fw-bold px-1 text-white bg-dark rounded">{selectedPartCategory.name}</span> will clear it from all parts.
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
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={handleUpdatePartCategory} disabled={(editPartCategoryName.trim() === (partCategories.find(c => c.id === selectedPartCategory.id)?.name) && JSON.stringify(selectedPartCategory.template_fields || []) === JSON.stringify(partCategories.find(c => c.id === selectedPartCategory.id)?.template_fields || [])) || editPartCategoryName.trim() === ""}>Save Category Settings</Button>
                                            </InputGroup>

                                            <hr className="border-secondary opacity-25 my-2" />

                                            <div className="template-manager">
                                                <h6 className="text-white small fw-bold text-uppercase letter-spacing-1 mb-3">Manage Template Fields</h6>
                                                
                                                <div className="bg-black p-3 rounded border border-secondary mb-3">
                                                    {selectedPartCategory.template_fields && selectedPartCategory.template_fields.length > 0 ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            {selectedPartCategory.template_fields.map((field, idx) => (
                                                                <div key={idx} className="bg-secondary p-2 rounded d-flex justify-content-between align-items-center border border-dark">
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <Badge bg={field.type === 'dimension' ? "info" : "secondary"} className={`${field.type === 'dimension' ? 'text-dark' : 'text-light'} small px-2 py-1`}>{field.is_bearing ? 'bearing' : (field.type === 'text' ? 'other units' : field.type)}</Badge>
                                                                        <span className="text-white fw-bold small">{field.key}</span>{field.is_primary && <Badge bg="info" className="text-dark extreme-small fw-black ms-2" style={{ letterSpacing: '0' }}>★ PRIMARY</Badge>}
                                                                        {field.unit && <Badge bg="secondary" className="small opacity-75">{field.unit}</Badge>}
                                                                        {field.diagram_url && <Badge bg="success" className="extreme-small border border-success border-opacity-25" title={field.diagram_url}>DIAGRAM SET</Badge>}
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Button variant="link" className="text-info p-0 border-0 me-2 text-decoration-none fw-bold" onClick={() => handleEditTemplateField(idx)}>Edit</Button>
                                                                        <Button variant="link" className="text-danger p-0 border-0 text-decoration-none opacity-50 hover-opacity-100" onClick={() => handleRemoveTemplateField(idx)}>Remove</Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-2 text-muted small italic">No template fields defined.</div>
                                                    )}
                                                </div>

                                                <div className="bg-dark p-4 rounded border border-secondary shadow-sm">
                                                    <h6 className="text-info extreme-small fw-bold text-uppercase mb-4 italic d-flex align-items-center gap-2">
                                                        <div className="bg-info" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                                                        {editingTemplateFieldIndex !== null ? 'Modifying Specification' : 'Define New Specification Field'}
                                                    </h6>
                                                    <Row className="g-3">
                                                        <Col md={3}>
                                                            <Form.Group>
                                                                <Form.Label className="extreme-small text-muted uppercase fw-bold mb-1 ms-1">Field Name*</Form.Label>
                                                                <Form.Control 
                                                                    type="text" 
                                                                    placeholder="e.g. Weight" 
                                                                    className="bg-black text-white border-secondary p-2 small transition-all focus-info" 
                                                                    value={newTemplateKey} 
                                                                    onChange={e => setNewTemplateKey(e.target.value)} 
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={2}>
                                                            <Form.Group>
                                                                <Form.Label className="extreme-small text-muted uppercase fw-bold mb-1 ms-1">Input Type</Form.Label>
                                                                <Form.Select 
                                                                    className="bg-black text-white border-secondary p-2 small cursor-pointer" 
                                                                    value={newTemplateType}
                                                                    onChange={e => {
                                                                        const val = e.target.value as 'text' | 'dimension';
                                                                        setNewTemplateType(val);
                                                                        if (val === 'text') {
                                                                            setNewTemplateUnit("");
                                                                            setNewTemplateIsBearing(false);
                                                                        } else {
                                                                            setNewTemplateUnit("mm");
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="dimension">Dimension (Number)</option>
                                                                    <option value="text">Label Box (Other)</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={1} className="d-flex align-items-end pb-2">
                                                            <div className="d-flex flex-column gap-2 mb-1">
                                                                <Form.Check 
                                                                    type="checkbox" 
                                                                    label={<span className="text-info extreme-small fw-bold text-uppercase italic">Primary</span>}
                                                                    className="ms-1"
                                                                    checked={newTemplateIsPrimary}
                                                                    onChange={e => setNewTemplateIsPrimary(e.target.checked)}
                                                                />
                                                            </div>
                                                        </Col>
                                                        <Col md={2} className="position-relative">
                                                            <Form.Group>
                                                                <Form.Label className="extreme-small text-muted uppercase fw-bold mb-1 ms-1">Field Unit</Form.Label>
                                                                {/* Primary Quick-links Above */}
                                                                <div className="d-flex gap-1 position-absolute" style={{ top: '-4px', right: '4px', zIndex: 10 }}>
                                                                    {['mm', 'cm', 'in'].map(u => (
                                                                        <Badge key={u} bg={newTemplateUnit === u ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => { setNewTemplateUnit(u); setNewTemplateType('dimension'); }}>{u}</Badge>
                                                                    ))}
                                                                </div>
                                                                
                                                                <Form.Control 
                                                                    type="text" 
                                                                    placeholder="mm, kg, etc." 
                                                                    className="bg-black text-white border-secondary p-2 small text-center" 
                                                                    value={newTemplateUnit} 
                                                                    onChange={e => setNewTemplateUnit(e.target.value)} 
                                                                />

                                                                {/* Secondary Quick-links Below */}
                                                                <div className="d-flex flex-wrap gap-1 position-absolute" style={{ bottom: '-15px', left: '4px', zIndex: 10, width: 'max-content' }}>
                                                                    <Badge bg={newTemplateIsBearing ? "primary" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => {
                                                                        const next = !newTemplateIsBearing;
                                                                        setNewTemplateIsBearing(next);
                                                                        if (next) {
                                                                            if (!newTemplateKey) setNewTemplateKey("Bearing Size");
                                                                            if (newTemplateUnit !== 'in') setNewTemplateUnit("mm");
                                                                            setNewTemplateType('dimension');
                                                                        }
                                                                    }}>Bearing</Badge>
                                                                    {['kg', 'lb', 'V', 'Wh', 'kv', 'T'].map(u => (
                                                                        <Badge key={u} bg={newTemplateUnit === u ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-50 hover-opacity-100" onClick={() => {
                                                                            setNewTemplateUnit(u);
                                                                            setNewTemplateType('text');
                                                                            setNewTemplateIsBearing(false);
                                                                        }}>{u}</Badge>
                                                                    ))}
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group>
                                                                <Form.Label className="extreme-small text-muted uppercase fw-bold mb-1 ms-1">Field Placeholder</Form.Label>
                                                                <InputGroup size="sm" className="shadow-sm">
                                                                    <Form.Control 
                                                                        type="text" 
                                                                        placeholder="e.g. 44..." 
                                                                        className="bg-black text-white p-2 small border-secondary" 
                                                                        value={newTemplatePlaceholder} 
                                                                        onChange={e => setNewTemplatePlaceholder(e.target.value)} 
                                                                        style={newTemplateType === 'dimension' ? { borderRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}}
                                                                    />
                                                                    {newTemplateType === 'dimension' && (
                                                                        <InputGroup.Text className="bg-transparent border-secondary border-start-0 text-info opacity-75 extreme-small fw-bold">
                                                                            {newTemplateUnit || 'mm'}
                                                                        </InputGroup.Text>
                                                                    )}
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Col>
                                                        
                                                        <Col md={9}>
                                                            <Form.Group>
                                                                <Form.Label className="extreme-small text-info uppercase fw-bold mb-1 ms-1 d-flex justify-content-between">
                                                                    <span>Helper Diagram / Measurement Guide</span>
                                                                    <span className="text-muted opacity-50">Upload file OR paste direct link</span>
                                                                </Form.Label>
                                                                <InputGroup size="sm" className="shadow-sm border border-secondary rounded overflow-hidden">
                                                                    <div className="position-relative bg-black d-flex align-items-center px-3 border-end border-secondary" style={{ minWidth: '140px' }}>
                                                                        <Form.Control 
                                                                            type="file" 
                                                                            className="position-absolute opacity-0 w-100 h-100 cursor-pointer" 
                                                                            style={{ left: 0, top: 0 }}
                                                                            accept="image/*"
                                                                            onChange={(e: any) => e.target.files[0] && handleDiagramUpload(e.target.files[0])}
                                                                            disabled={isUploadingDiagram}
                                                                        />
                                                                        <span className="text-info extreme-small fw-bold uppercase letter-spacing-1">
                                                                            {isUploadingDiagram ? <Spinner animation="border" size="sm" className="me-2" /> : '📁 Upload File'}
                                                                        </span>
                                                                    </div>
                                                                    <Form.Control 
                                                                        type="text" 
                                                                        placeholder="https://example.com/diagram.png" 
                                                                        className="bg-black text-white p-2 small border-0" 
                                                                        value={newTemplateDiagramUrl} 
                                                                        onChange={e => setNewTemplateDiagramUrl(e.target.value)} 
                                                                    />
                                                                    {newTemplateDiagramUrl && (
                                                                        <InputGroup.Text className="bg-dark border-0 p-0 overflow-hidden" style={{ width: '42px' }}>
                                                                            <img src={newTemplateDiagramUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        </InputGroup.Text>
                                                                    )}
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={3} className="d-flex align-items-end gap-2">
                                                            <Button variant={editingTemplateFieldIndex !== null ? "success" : "info"} className="w-100 fw-bold small py-2 shadow-sm" onClick={handleAddTemplateField} disabled={!newTemplateKey.trim() || isUploadingDiagram}>
                                                                {editingTemplateFieldIndex !== null ? 'UPDATE' : 'ADD FIELD'}
                                                            </Button>
                                                            {editingTemplateFieldIndex !== null && (
                                                                <Button variant="outline-secondary" className="small py-2 px-3 border-secondary" onClick={handleCancelTemplateEdit} disabled={isUploadingDiagram}>Cancel</Button>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between mt-2">
                                                <Button variant="secondary" size="sm" className="fw-bold" onClick={() => setSelectedPartCategory(null)}>Close Editor</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => setPartCategoryDeleteConfirm(true)}>Delete "{selectedPartCategory.name}"</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <InputGroup className="w-100 shadow-sm">
                                <Form.Control type="text" placeholder="Enter new category name..." className="input-contrast p-3" value={newPartCategory} onChange={e => setNewPartCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPartCategory()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddPartCategory}>Add Category</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                    {/* 5. Fabrication Methods */}
                    <Tab eventKey="fabrication_methods" title="5. Fabrication Methods">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Fabrication Protocols</h5>
                            <p className="text-muted small mb-4">Add or remove fabrication methods globally.</p>

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
                                                <strong>Confirm Deletion:</strong> Are you sure? Deleting <span className="fw-bold px-1 text-white bg-dark rounded">{selectedFabMethod.name}</span> will clear it from all parts.
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
                                <Form.Control type="text" placeholder="Enter new fabrication method..." className="input-contrast p-3" value={newFabMethod} onChange={e => setNewFabMethod(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFabMethod()} />
                                <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddFabMethod}>Add Method</Button>
                            </InputGroup>
                        </div>
                    </Tab>

                    {/* 6. Board Platforms */}
                    <Tab eventKey="platforms" title="6. Board Platforms">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <h5 className="text-info fw-bold mb-3">Manufacturers & Platforms</h5>
                            <p className="text-muted small mb-4">Add or remove board platforms globally.</p>

                            {isBoardLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : (
                                <>
                                    <div className="bg-black p-4 rounded border border-secondary mb-5 shadow-inner">
                                        <div className="mb-4 pb-4 border-bottom border-secondary">
                                            <div className="text-center mb-3">
                                                <span className="text-info fw-bold text-uppercase letter-spacing-1 small">Special Platforms</span>
                                            </div>
                                            <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: "400px" }}>
                                                {specialPlatformsData.map(brand => (
                                                    <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm">
                                                        <span className="small fw-bold text-light ms-2">{brand.name}</span>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            className="py-1 px-3 fw-bold"
                                                            onClick={() => {
                                                                setEditingBrandAdmin(brand);
                                                                setEditBrandName(brand.name);
                                                                setEditBrandOverview(brand.description || "");
                                                                setEditBrandImage(brand.image_url || null);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-center mb-4">
                                            <span className="text-info fw-bold text-uppercase letter-spacing-1 small">Alphabetical Registry</span>
                                        </div>

                                        <Row className="g-4">
                                            <Col md={4}>
                                                <div className="text-center mb-2">
                                                    <span className="small fw-bold text-muted uppercase letter-spacing-1">0-9 / A - I</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    {alphabeticalBrandsData.group1.map(brand => (
                                                        <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm">
                                                            <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                className="py-1 px-3 fw-bold"
                                                                onClick={() => {
                                                                    setEditingBrandAdmin(brand);
                                                                    setEditBrandName(brand.name);
                                                                    setEditBrandOverview(brand.description || "");
                                                                    setEditBrandImage(brand.image_url || null);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="text-center mb-2">
                                                    <span className="small fw-bold text-muted uppercase letter-spacing-1">J - R</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    {alphabeticalBrandsData.group2.map(brand => (
                                                        <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm">
                                                            <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                className="py-1 px-3 fw-bold"
                                                                onClick={() => {
                                                                    setEditingBrandAdmin(brand);
                                                                    setEditBrandName(brand.name);
                                                                    setEditBrandOverview(brand.description || "");
                                                                    setEditBrandImage(brand.image_url || null);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="text-center mb-2">
                                                    <span className="small fw-bold text-muted uppercase letter-spacing-1">S - Z</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    {alphabeticalBrandsData.group3.map(brand => (
                                                        <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm">
                                                            <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                className="py-1 px-3 fw-bold"
                                                                onClick={() => {
                                                                    setEditingBrandAdmin(brand);
                                                                    setEditBrandName(brand.name);
                                                                    setEditBrandOverview(brand.description || "");
                                                                    setEditBrandImage(brand.image_url || null);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    <InputGroup className="w-100 shadow-sm">
                                        <Form.Control type="text" placeholder="Enter new platform name..." className="input-contrast p-3" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPlatform()} />
                                        <Button variant="primary" className="fw-bold px-4 px-md-5 border-secondary" onClick={handleAddPlatform}>Add Brand</Button>
                                    </InputGroup>
                                </>
                            )}
                        </div>
                    </Tab>

                    {/* 7. Manage Hardware Models */}
                    <Tab eventKey="models" title="7. Manage Hardware Models">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
                                <div>
                                    <h5 className="text-info fw-bold mb-1">Hardware Models Registry</h5>
                                    <p className="text-muted small mb-0">Select a platform to manage its specific board models.</p>
                                </div>
                                {selectedModelPlatform && (
                                    <Button variant="outline-info" size="sm" className="fw-bold px-4" onClick={() => setSelectedModelPlatform(null)}>
                                        &larr; Back to Platforms
                                    </Button>
                                )}
                            </div>

                            {/* Reconciliation Section (Always high priority) */}
                            {ghostModels.length > 0 && (
                                <div className="mb-5 p-4 bg-black bg-opacity-50 border border-warning border-opacity-25 rounded shadow-sm">
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <Badge bg="warning" text="dark" className="p-2 border border-dark">ACTION REQUIRED</Badge>
                                        <h6 className="text-warning fw-bold mb-0 text-uppercase letter-spacing-1">Model Reconciliation Needed</h6>
                                    </div>
                                    <p className="small text-muted mb-4 italic">
                                        The following models exist in the parts registry but are missing from the official hardware database.
                                        Clicking "Promote" will create a registry entry and link all associated parts automatically.
                                    </p>
                                    <div className="d-flex flex-column gap-3">
                                        {ghostModels.map((ghost, i) => (
                                            <div key={i} className="bg-secondary bg-opacity-25 p-3 rounded border border-secondary d-flex justify-content-between align-items-center shadow-inner">
                                                <div>
                                                    <span className="text-info small fw-bold text-uppercase d-block mb-1">{ghost.brand_name}</span>
                                                    <span className="text-white fw-bold">{ghost.model_name}</span>
                                                    <Badge bg="none" className="ms-2 border border-secondary text-muted small">{ghost.part_ids.length} parts affected</Badge>
                                                </div>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="fw-bold px-4"
                                                    onClick={() => handlePromoteModel(ghost)}
                                                    disabled={isActionLoading}
                                                >
                                                    {isActionLoading ? <Spinner animation="border" size="sm" /> : 'Promote to Registry'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!selectedModelPlatform ? (
                                <div className="bg-black p-4 rounded border border-secondary mb-5 shadow-inner">
                                    <div className="mb-4 pb-4 border-bottom border-secondary">
                                        <div className="text-center mb-3">
                                            <span className="text-info fw-bold text-uppercase letter-spacing-1 small">Special Platforms</span>
                                        </div>
                                        <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: "400px" }}>
                                            {specialPlatformsData.map(brand => (
                                                <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm cursor-pointer hover-bg-dark transition-all" onClick={() => setSelectedModelPlatform(brand.name)}>
                                                    <span className="small fw-bold text-light ms-2">{brand.name}</span>
                                                    <Badge bg="none" className="border border-info text-info small">{groupedModels[brand.name]?.length || 0}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Row className="g-4">
                                        <Col md={4}>
                                            <div className="text-center mb-2">
                                                <span className="small fw-bold text-muted uppercase letter-spacing-1">0-9 / A - I</span>
                                            </div>
                                            <div className="d-flex flex-column gap-2">
                                                {alphabeticalBrandsData.group1.map(brand => (
                                                    <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm cursor-pointer hover-bg-dark transition-all" onClick={() => setSelectedModelPlatform(brand.name)}>
                                                        <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                        <Badge bg="none" className="border border-info text-info small">{groupedModels[brand.name]?.length || 0}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center mb-2">
                                                <span className="small fw-bold text-muted uppercase letter-spacing-1">J - R</span>
                                            </div>
                                            <div className="d-flex flex-column gap-2">
                                                {alphabeticalBrandsData.group2.map(brand => (
                                                    <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm cursor-pointer hover-bg-dark transition-all" onClick={() => setSelectedModelPlatform(brand.name)}>
                                                        <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                        <Badge bg="none" className="border border-info text-info small">{groupedModels[brand.name]?.length || 0}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center mb-2">
                                                <span className="small fw-bold text-muted uppercase letter-spacing-1">S - Z</span>
                                            </div>
                                            <div className="d-flex flex-column gap-2">
                                                {alphabeticalBrandsData.group3.map(brand => (
                                                    <div key={brand.id} className="bg-secondary p-2 rounded border border-dark d-flex justify-content-between align-items-center shadow-sm cursor-pointer hover-bg-dark transition-all" onClick={() => setSelectedModelPlatform(brand.name)}>
                                                        <span className="small fw-bold text-light ms-2 text-truncate pe-2">{brand.name}</span>
                                                        <Badge bg="none" className="border border-info text-info small">{groupedModels[brand.name]?.length || 0}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            ) : (
                                <div className="animate-in slide-in-bottom">
                                    <div className="mb-5">
                                        <div className="d-flex align-items-center gap-2 mb-4">
                                            <div className="bg-info" style={{ width: '4px', height: '24px' }}></div>
                                            <h4 className="text-white fw-bold mb-0 text-uppercase letter-spacing-1">{selectedModelPlatform} Models</h4>
                                        </div>

                                        <Row className="g-4 mb-5">
                                            {(groupedModels[selectedModelPlatform] || []).map((m: any) => (
                                                <Col key={m.id} xs={12} sm={6} md={4} lg={3}>
                                                    <div className="bg-black rounded border border-secondary overflow-hidden h-100 d-flex flex-column shadow-sm transition-hover cursor-pointer" onClick={() => {
                                                        setEditingModelAdmin(m);
                                                        setEditModelName(m.name);
                                                        setEditModelDesc(m.description || "");
                                                        setEditModelImage(m.image_url || null);
                                                    }}>
                                                        <div className="bg-dark p-3 d-flex align-items-center justify-content-center" style={{ aspectRatio: '16/9', backgroundColor: '#0a0a0a' }}>
                                                            {m.image_url && !m.image_url.includes('placehold.co') ? (
                                                                <img src={m.image_url} alt={m.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                            ) : (
                                                                <div className="text-secondary opacity-10 italic fw-black" style={{ fontSize: '40px' }}>{m.name[0]}</div>
                                                            )}
                                                        </div>
                                                        <div className="p-3 border-top border-secondary flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h6 className="text-white fw-bold text-uppercase mb-0 small" style={{ letterSpacing: '0.05em' }}>{m.name}</h6>
                                                                {parts.some(p => p.model_id === m.id && p.needs_model_review) && <Badge bg="warning" text="dark" className="small border border-dark">REVIEW</Badge>}
                                                            </div>
                                                            <p className="text-muted small mb-0 line-clamp-2" style={{ fontSize: '10px' }}>{m.description || "No registry description provided."}</p>
                                                        </div>
                                                        <div className="p-2 bg-dark text-center border-top border-secondary opacity-50 small fw-bold text-info uppercase letter-spacing-1" style={{ fontSize: '9px' }}>
                                                            Configure Details
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                            {!(groupedModels[selectedModelPlatform] || []).length && (
                                                <div className="p-5 bg-black bg-opacity-25 rounded border border-dashed border-secondary text-muted small italic w-100 text-center">
                                                    No hardware models currently registered for this platform.
                                                </div>
                                            )}
                                        </Row>

                                        <div className="p-4 bg-secondary border border-secondary rounded shadow-sm">
                                            <h6 className="text-info fw-bold mb-3 uppercase letter-spacing-1">Register New Model for {selectedModelPlatform}</h6>
                                            <InputGroup className="w-100 shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control
                                                    type="text"
                                                    className="input-contrast p-3 border-0 fw-bold"
                                                    value={newModelName}
                                                    onChange={e => setNewModelName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && selectedModelPlatform && handleAddBoardModelWithName(selectedModelPlatform)}
                                                    placeholder="e.g. Hurricane Ninja"
                                                />
                                                <Button
                                                    variant="success"
                                                    className="fw-bold px-4 px-md-5 border-0"
                                                    onClick={() => selectedModelPlatform && handleAddBoardModelWithName(selectedModelPlatform)}
                                                    disabled={!newModelName.trim() || isLoading}
                                                >
                                                    {isLoading ? <Spinner animation="border" size="sm" /> : 'Save Model'}
                                                </Button>
                                            </InputGroup>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab>


                    {/* 8. Hidden */}
                    <Tab eventKey="hidden" title={`8. Hidden (${trulyHiddenParts.length})`}>
                        <div className="mt-4">
                            {isHiddenLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : trulyHiddenParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No hidden assets found.
                                </div>
                            ) : (
                                <Row className="g-4">
                                    {trulyHiddenParts.map(part => (
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
                        <div className="mt-4">
                            {isDeletedLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : deletedParts.length === 0 ? (
                                <div className="p-5 text-center text-muted bg-secondary rounded border border-secondary shadow-sm" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Trash bin is empty.
                                </div>
                            ) : (
                                <Row className="g-4">
                                    {deletedParts.map(part => (
                                        <AdminPartCard key={part.id} part={part} onEdit={() => setEditingPart({ ...part })} actions={
                                            <>
                                                <Button variant="outline-success" size="sm" className="w-50 fw-bold" onClick={() => handleRestorePart(part.id!, 'deleted')} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Recover'}
                                                </Button>
                                                <Button variant="danger" size="sm" className="w-50 fw-bold" onClick={() => handlePermDeletePart(part.id!)} disabled={actionLoadingId === part.id}>
                                                    {actionLoadingId === part.id ? <Spinner size="sm" animation="border" /> : 'Purge'}
                                                </Button>
                                            </>
                                        } />
                                    ))}
                                </Row>
                            )}
                        </div>
                    </Tab>

                    {/* 10. Attribute Dictionary */}
                    <Tab eventKey="attributes" title={`10. Attributes (${attributeDictionary.length})`}>
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
                                <div>
                                    <h5 className="text-info fw-bold mb-1">Global Attribute Dictionary</h5>
                                    <p className="text-muted small mb-0">Review and reconcile custom JSONB attributes used across all parts.</p>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <span className="small fw-bold text-muted uppercase letter-spacing-1">Filter Category:</span>
                                    <Form.Select 
                                        className="bg-black text-white border-secondary py-3 px-4 fw-bold shadow-sm" 
                                        style={{ width: 'auto', minWidth: '350px', fontSize: '1.1rem' }}
                                        value={selectedAttributeCategory} 
                                        onChange={e => setSelectedAttributeCategory(e.target.value)}
                                    >
                                        <option value="all">📁 All Categories / Global Search</option>
                                        <option disabled>──────────</option>
                                        {partCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                            </div>

                            {isLoading || isHiddenLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : attributeDictionary.length === 0 ? (
                                <div className="p-5 text-center text-gray-400 bg-secondary rounded border border-secondary shadow-sm">
                                    No custom attributes discovered in the catalog.
                                </div>
                            ) : (
                                <div className="table-responsive rounded border border-secondary overflow-hidden">
                                    <table className="table table-dark table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th className="bg-black border-secondary py-3 ps-4 small fw-bold text-uppercase letter-spacing-1">Attribute Key</th>
                                                <th className="bg-black border-secondary py-3 small fw-bold text-uppercase letter-spacing-1 text-center">Usage Count</th>
                                                <th className="bg-black border-secondary py-3 pe-4 small fw-bold text-uppercase letter-spacing-1 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attributeDictionary.map((attr, idx) => (
                                                <tr key={idx} className="border-secondary">
                                                    <td className="py-3 ps-4 align-middle">
                                                        <span className="text-info font-monospace fw-bold">{attr.key}</span>
                                                    </td>
                                                    <td className="py-3 text-center align-middle">
                                                        <Badge 
                                                            bg="secondary" 
                                                            className="px-3 py-2 border border-secondary cursor-pointer transition-all hover-opacity-75"
                                                            title={`Filter registry for "${attr.key}"`}
                                                            onClick={() => {
                                                                setActiveAttributeFilter(attr.key);
                                                                handleTabSelect('registry');
                                                            }}
                                                        >
                                                            {attr.count} uses
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 pe-4 text-end align-middle">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button variant="outline-light" size="sm" className="fw-bold px-3 py-2" onClick={() => { setTargetAttributeKey(attr.key); setNewAttributeKey(attr.key); setShowAttributeMergeModal(true); }}>
                                                                Rename / Merge
                                                            </Button>
                                                            <Button variant="outline-danger" size="sm" className="fw-bold px-3 py-2" onClick={() => handlePurgeAttribute(attr.key)}>
                                                                Purge / Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Tab>

                    {/* 11. Needs Description / Images */}
                    <Tab eventKey="missing" title="11. Asset Audit (Missing Info)">
                        <div className="mt-4 p-4 p-md-5 bg-dark border border-secondary rounded shadow-sm">
                            <div className="mb-5">
                                <h5 className="text-info fw-bold mb-1">Database Asset Tracking</h5>
                                <p className="text-muted small">Identify and fix missing descriptions, images, and diagrams.</p>
                            </div>

                            {isAuditLoading ? (
                                <div className="p-5 text-center"><Spinner animation="border" variant="info" /></div>
                            ) : (
                                <Row className="g-4">
                                    <Col lg={4}>
                                        <Card className="bg-black border-secondary h-100 shadow-sm">
                                            <Card.Header className="bg-dark border-secondary p-3 d-flex justify-content-between align-items-center">
                                                <h6 className="text-white fw-bold mb-0 uppercase letter-spacing-1 small">Brands Missing Info</h6>
                                                <Badge bg="danger">{missingBrands.length}</Badge>
                                            </Card.Header>
                                            <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '400px' }}>
                                                {missingBrands.length === 0 ? (
                                                    <div className="p-4 text-center text-muted small italic">Registry healthy.</div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {missingBrands.map(b => (
                                                            <div key={b.id} className="list-group-item bg-transparent border-secondary border-opacity-25 d-flex justify-content-between align-items-center py-3">
                                                                <div className="pe-2">
                                                                    <div className="text-white fw-bold small">{b.name}</div>
                                                                    <div className="text-danger extreme-small uppercase letter-spacing-1">Missing {!b.description ? 'Desc' : ''}{!b.description && !b.image_url ? ' / ' : ''}{!b.image_url ? 'Image' : ''}</div>
                                                                </div>
                                                                <Button variant="outline-info" size="sm" className="extreme-small fw-bold" onClick={() => { setEditingBrandAdmin(b); setEditBrandName(b.name); setEditBrandOverview(b.description || ""); setEditBrandImage(b.image_url || null); }}>EDIT</Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col lg={4}>
                                        <Card className="bg-black border-secondary h-100 shadow-sm">
                                            <Card.Header className="bg-dark border-secondary p-3 d-flex justify-content-between align-items-center">
                                                <h6 className="text-white fw-bold mb-0 uppercase letter-spacing-1 small">Models Missing Info</h6>
                                                <Badge bg="danger">{missingModels.length}</Badge>
                                            </Card.Header>
                                            <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '400px' }}>
                                                {missingModels.length === 0 ? (
                                                    <div className="p-4 text-center text-muted small italic">All models populated.</div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {missingModels.map(m => (
                                                            <div key={m.id} className="list-group-item bg-transparent border-secondary border-opacity-25 d-flex justify-content-between align-items-center py-3">
                                                                <div className="pe-2">
                                                                    <div className="text-white fw-bold small">{m.name}</div>
                                                                    <div className="text-info extreme-small fw-bold">{(m as any).brands?.name}</div>
                                                                    <div className="text-danger extreme-small uppercase letter-spacing-1">Missing {!m.description ? 'Desc' : ''}{!m.description && !m.image_url ? ' / ' : ''}{!m.image_url ? 'Image' : ''}</div>
                                                                </div>
                                                                <Button variant="outline-info" size="sm" className="extreme-small fw-bold" onClick={() => { setEditingModelAdmin(m); setEditModelName(m.name); setEditModelDesc(m.description || ""); setEditModelImage(m.image_url || null); }}>EDIT</Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col lg={4}>
                                        <Card className="bg-black border-secondary h-100 shadow-sm">
                                            <Card.Header className="bg-dark border-secondary p-3 d-flex justify-content-between align-items-center">
                                                <h6 className="text-white fw-bold mb-0 uppercase letter-spacing-1 small">Missing Diagrams</h6>
                                                <Badge bg="warning" text="dark">{missingAttributes.length}</Badge>
                                            </Card.Header>
                                            <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '400px' }}>
                                                {missingAttributes.length === 0 ? (
                                                    <div className="p-4 text-center text-muted small italic">Diagram library complete.</div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {missingAttributes.map((attr, idx) => (
                                                            <div key={idx} className="list-group-item bg-transparent border-secondary border-opacity-25 d-flex justify-content-between align-items-start py-3">
                                                                <div>
                                                                    <div className="text-white fw-bold small">{attr.fieldKey}</div>
                                                                    <Badge bg="secondary" className="extreme-small">{attr.categoryName}</Badge>
                                                                </div>
                                                                <Button variant="outline-info" size="sm" className="extreme-small fw-bold" onClick={() => { 
                                                                    const cat = partCategories.find(c => c.name === attr.categoryName);
                                                                    if (cat) {
                                                                        setSelectedPartCategory(cat);
                                                                        setEditPartCategoryName(cat.name);
                                                                        setActiveTab('categories');
                                                                    }
                                                                }}>GOTO CAT</Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            )}
                    </Tab>
                </Tabs>

                {editingPart && (
                    <Modal show={true} onHide={() => setEditingPart(null)} size={isLandscape ? "xl" : "lg"} data-bs-theme="dark" backdrop="static" centered scrollable className="admin-edit-modal">
                        <Modal.Header closeButton className="bg-dark border-secondary text-light p-4 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <Modal.Title className="fw-bold h5 text-uppercase italic mb-0">Registry Asset Edit</Modal.Title>
                                <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    className="fw-bold extreme-small uppercase letter-spacing-1"
                                    onClick={() => setIsLandscape(!isLandscape)}
                                >
                                    {isLandscape ? 'Switch to Vertical' : 'Switch to Landscape'}
                                </Button>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="bg-dark text-light p-0">
                            <style dangerouslySetInnerHTML={{ __html: `
                                .admin-edit-modal .modal-content { border-radius: 20px; overflow: hidden; border: 1px solid #333; }
                                .admin-edit-modal .modal-body { max-height: 85vh; overflow-y: auto; }
                                .admin-edit-modal .form-label { color: #f8f9fa !important; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
                                .admin-edit-modal .form-control, .admin-edit-modal .form-select { border-color: #2a2e35 !important; }
                                .admin-edit-modal .form-control:focus, .admin-edit-modal .form-select:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 0.2rem rgba(6, 182, 212, 0.1) !important; }
                                .admin-edit-modal .extreme-small { font-size: 0.65rem; }
                                .admin-edit-modal .uppercase { text-transform: uppercase; }
                                .admin-edit-modal .letter-spacing-1 { letter-spacing: 0.1em; }
                                .admin-edit-modal .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.5) !important; }
                                .admin-edit-modal .italic { font-style: italic; }
                            `}} />
                            <div className="p-4 p-md-5">
                                <div className={isLandscape ? "row g-4" : "d-flex flex-column gap-5"}>
                                    {/* COLUMN 1: IMAGE & CORE INFO */}
                                    <div className={isLandscape ? "col-lg-4 border-end border-secondary border-opacity-25" : ""}>
                                        {(() => {
                                            const imgSrc = Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : editingPart.image_src;
                                            return (
                                                <div className="mb-4 bg-black rounded border border-secondary position-relative shadow-inner overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '100%', minHeight: imgSrc ? '250px' : '150px' }}>
                                                    {imgSrc ? (
                                                        <img src={imgSrc} alt="Preview" className="w-100 h-100 p-2" style={{ objectFit: 'contain', maxHeight: '350px' }} />
                                                    ) : (
                                                        <div className="text-muted small">No Image Available</div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-2">Image URL</Form.Label>
                                            <Form.Control type="text" value={Array.isArray(editingPart.image_src) ? editingPart.image_src[0] : (editingPart.image_src || '')} onChange={e => setEditingPart({ ...editingPart, image_src: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm small" />
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-2">Part Title *</Form.Label>
                                            <Form.Control type="text" value={editingPart.title || ''} onChange={e => setEditingPart({ ...editingPart, title: e.target.value })} className="bg-black text-white border-secondary p-3 shadow-sm fw-bold" />
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-2">Project Link (Universal URL) *</Form.Label>
                                            <Form.Control type="text" value={editingPart.external_url || ''} onChange={e => setEditingPart({ ...editingPart, external_url: e.target.value })} className="bg-black text-white border-secondary p-2 shadow-sm small" />
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-2">Mirror Link</Form.Label>
                                            <Form.Control type="text" value={editingPart.dropbox_url || ''} onChange={e => setEditingPart({ ...editingPart, dropbox_url: e.target.value })} className="bg-black text-white border-secondary p-2 shadow-sm small" placeholder="Dropbox, Google Drive, etc." />
                                        </Form.Group>

                                        <div className="d-flex gap-2">
                                            <Form.Group className="flex-fill">
                                                <Form.Label className="extreme-small uppercase fw-bold opacity-50 text-light mb-1">Author</Form.Label>
                                                <Form.Control size="sm" type="text" value={editingPart.author || ''} onChange={e => setEditingPart({ ...editingPart, author: e.target.value })} className="bg-black text-white border-secondary p-2 shadow-sm" />
                                            </Form.Group>
                                            <Form.Group className="flex-fill">
                                                <Form.Label className="extreme-small uppercase fw-bold opacity-50 text-light mb-1">Submitter</Form.Label>
                                                <Form.Control size="sm" type="text" value={editingPart.submitted_by || ''} onChange={e => setEditingPart({ ...editingPart, submitted_by: e.target.value })} className="bg-black text-white border-secondary p-2 shadow-sm" />
                                            </Form.Group>
                                        </div>
                                    </div>

                                    {/* COLUMN 2: HARDWARE & TAXONOMY */}
                                    <div className={isLandscape ? "col-lg-4 border-end border-secondary border-opacity-25" : ""}>
                                        <div className="p-4 bg-black bg-opacity-50 rounded border border-secondary mb-4 shadow-inner">
                                            <h6 className="small uppercase fw-bold opacity-75 text-light mb-4">Hardware Association</h6>
                                            <HardwareFields
                                                brandId={editingPart.platform_id || null}
                                                modelId={editingPart.model_id || editingPart.board_model || null}
                                                needsModelReview={editingPart.needs_model_review || false}
                                                onChangeModel={(m) => setEditingPart(prev => prev ? { ...prev, model_id: m } : null)}
                                                onChangeNeedsReview={(b) => setEditingPart(prev => prev ? { ...prev, needs_model_review: b } : null)}
                                            />
                                        </div>

                                        <div className="d-flex flex-column gap-3 mb-4">
                                            <Form.Group>
                                                <Form.Label className="extreme-small uppercase fw-bold opacity-50 text-light mb-2">Platform / Brand</Form.Label>
                                                <Form.Select size="sm" className="bg-black text-white border-secondary p-2" value={editingPart.platform_id || ''} onChange={e => setEditingPart({ ...editingPart, platform_id: e.target.value })}>
                                                    <option value="">Select Platform...</option>
                                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group>
                                                <Form.Label className="extreme-small uppercase fw-bold opacity-50 text-light mb-2">Part Category</Form.Label>
                                                <Form.Select size="sm" className="bg-black text-white border-secondary p-2" value={editingPart.category_id || ''} onChange={e => setEditingPart({ ...editingPart, category_id: e.target.value })}>
                                                    <option value="">Select Category...</option>
                                                    {partCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group>
                                                <Form.Label className="extreme-small uppercase fw-bold opacity-50 text-light mb-2">Fabrication Method</Form.Label>
                                                <Form.Select size="sm" className="bg-black text-white border-secondary p-2" value={editingPart.fabrication_method_id || ''} onChange={e => setEditingPart({ ...editingPart, fabrication_method_id: e.target.value })}>
                                                    <option value="">Select Method...</option>
                                                    {fabricationMethods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </div>
                                    </div>

                                    {/* COLUMN 3: ATTRIBUTES */}
                                    <div className={isLandscape ? "col-lg-4" : ""}>
                                        <h6 className="small uppercase fw-bold opacity-75 text-light mb-4">Specifications (Attributes)</h6>
                                        <div className="bg-black p-4 rounded border border-secondary mb-4 shadow-inner">
                                            {(() => {
                                                const activeCat = partCategories.find(c => c.id === editingPart.category_id);
                                                const attributes = (editingPart.attributes || {}) as Record<string, any>;
                                                const templateFields = activeCat?.template_fields || [];

                                                return (
                                                    <>
                                                        {templateFields.length > 0 && (
                                                            <div className="mb-4">
                                                                <div className="text-info extreme-small fw-bold text-uppercase mb-3 opacity-50">Template Fields</div>
                                                                <div className="d-flex flex-column gap-2 mb-4">
                                                                    {templateFields.map((tf: any) => (
                                                                        <div key={tf.key} className="pb-3 border-bottom border-secondary border-opacity-10">
                                                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                                                <Form.Label className="extreme-small uppercase fw-bold opacity-75 text-light mb-0">{tf.key}</Form.Label>
                                                                                {tf.diagram_url && (
                                                                                    <Button variant="link" size="sm" className="p-0 text-info opacity-50 extreme-small" onClick={() => setAttributeZoomedFields(prev => ({ ...prev, [tf.key]: !prev[tf.key] }))}>?</Button>
                                                                                )}
                                                                            </div>
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <div className="flex-grow-1">
                                                                                    {tf.is_bearing ? (
                                                                                        <div className="d-flex align-items-center gap-1">
                                                                                            {(() => {
                                                                                                const bVal = attributes[tf.key] || "0x0x0";
                                                                                                const [bid, bod, bw] = bVal.split('x');
                                                                                                const updateBearing = (newVal: string, idx: number) => {
                                                                                                    const parts = bVal.split('x');
                                                                                                    parts[idx] = newVal || '0';
                                                                                                    const finalVal = parts.join('x');
                                                                                                    const newAttrs: Record<string, any> = { ...attributes, [tf.key]: finalVal };
                                                                                                    newAttrs[`${tf.key}__unit`] = attributeDimensionUnits[tf.key] || 'mm';
                                                                                                    setEditingPart({ ...editingPart, attributes: newAttrs });
                                                                                                };
                                                                                                return (
                                                                                                    <>
                                                                                                        <Form.Control size="sm" placeholder="ID" className="bg-black text-white border-secondary p-1 small text-center flex-grow-1" value={bid === '0' ? '' : bid} onChange={e => updateBearing(e.target.value, 0)} />
                                                                                                        <span className="text-secondary tiny">×</span>
                                                                                                        <Form.Control size="sm" placeholder="OD" className="bg-black text-white border-secondary p-1 small text-center flex-grow-1" value={bod === '0' ? '' : bod} onChange={e => updateBearing(e.target.value, 1)} />
                                                                                                        <span className="text-secondary tiny">×</span>
                                                                                                        <Form.Control size="sm" placeholder="W" className="bg-black text-white border-secondary p-1 small text-center flex-grow-1" value={bw === '0' ? '' : bw} onChange={e => updateBearing(e.target.value, 2)} />
                                                                                                    </>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <Form.Control
                                                                                            size="sm"
                                                                                            type={(tf.type === 'dimension') ? 'number' : 'text'}
                                                                                            step="any"
                                                                                            value={attributes[tf.key] || ""}
                                                                                            onChange={e => {
                                                                                                const newAttrs: Record<string, any> = { ...attributes, [tf.key]: e.target.value };
                                                                                                newAttrs[`${tf.key}__unit`] = tf.type === 'dimension' ? (attributeDimensionUnits[tf.key] || 'mm') : tf.unit;
                                                                                                setEditingPart({ ...editingPart, attributes: newAttrs });
                                                                                            }}
                                                                                            className="bg-black text-white p-2 small border-secondary text-end"
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                {tf.type === 'dimension' && (
                                                                                    <Button 
                                                                                        variant="outline-secondary" 
                                                                                        size="sm" 
                                                                                        className="extreme-small border-secondary" 
                                                                                        style={{ width: '40px', color: '#06b6d4' }}
                                                                                        onClick={() => {
                                                                                            const current = attributeDimensionUnits[tf.key] || 'mm';
                                                                                            const next = current === 'mm' ? 'cm' : current === 'cm' ? 'in' : 'mm';
                                                                                            setAttributeDimensionUnits(prev => ({ ...prev, [tf.key]: next }));
                                                                                            const newAttrs = { ...attributes, [`${tf.key}__unit`]: next };
                                                                                            setEditingPart({ ...editingPart, attributes: newAttrs });
                                                                                        }}
                                                                                    >
                                                                                        {attributeDimensionUnits[tf.key] || 'mm'}
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                            {tf.diagram_url && attributeZoomedFields[tf.key] && (
                                                                                <div className="mt-2 rounded bg-white p-1">
                                                                                    <img src={tf.diagram_url} alt="Guide" className="img-fluid" style={{ maxHeight: '150px' }} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="mb-4">
                                                            <div className="text-warning extreme-small fw-bold text-uppercase mb-3 opacity-50">Custom Specifications</div>
                                                            <SharedAttributeEditor
                                                                attributes={attributes}
                                                                onChange={(newAttrs) => setEditingPart({ ...editingPart, attributes: newAttrs })}
                                                                templateFields={templateFields || []}
                                                                suggestions={attributeDictionary.map(a => a.key)}
                                                            />
                                                        </div>
                                                        
                                                        <Form.Check type="checkbox" id="edit-oem-check" label="OFFICIAL OEM PART" checked={editingPart.is_oem || false} onChange={e => setEditingPart({ ...editingPart, is_oem: e.target.checked })} className="fw-bold text-primary mb-2" />
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="bg-dark border-secondary p-4">
                            <Button variant="secondary" onClick={() => setEditingPart(null)} className="px-4">Cancel</Button>
                            <Button variant="success" className="px-5 fw-bold shadow-lg" onClick={handleSaveEdit} disabled={isSavingEdit}>
                                {isSavingEdit ? <Spinner size="sm" animation="border" className="me-2" /> : "Publish Changes"}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}



                {/* BRAND EDIT MODAL */}
                <Modal show={!!editingBrandAdmin} onHide={() => setEditingBrandAdmin(null)} size="lg" centered>
                    <Modal.Header closeButton closeVariant="dark" className="bg-white border-bottom shadow-sm">
                        <Modal.Title className="fw-bold text-uppercase h6 letter-spacing-1 text-dark">Brand Overview Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-white p-4">
                        <Row className="g-4">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-secondary text-uppercase">Brand Title</Form.Label>
                                    <Form.Control type="text" className="bg-light text-dark border-secondary border-opacity-25 p-3 fw-bold" value={editBrandName} onChange={e => setEditBrandName(e.target.value)} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-secondary text-uppercase">Overview Information</Form.Label>
                                    <Form.Control as="textarea" rows={5} className="bg-light text-dark border-secondary border-opacity-25 p-3" value={editBrandOverview} onChange={e => setEditBrandOverview(e.target.value)} placeholder="Default text displayed on brand pages..." />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-muted uppercase">Brand Image (Banner/Overview)</Form.Label>
                                    <Form.Control type="file" className="bg-light border-0" onChange={(e: any) => e.target.files[0] && editingBrandAdmin?.id && handleImageUpload('brands', editingBrandAdmin.id, e.target.files[0])} disabled={isActionLoading} />
                                    {isActionLoading && <div className="mt-2 small text-info"><Spinner animation="border" size="sm" className="me-2" /> Syncing to persistent storage...</div>}
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button variant="dark" className="w-100 fw-bold py-3" onClick={handleUpdateBrandAdvanced} disabled={isBrandSaving}>
                                        {isBrandSaving ? <Spinner animation="border" size="sm" /> : 'Apply Brand Sync'}
                                    </Button>
                                    <Button variant="outline-danger" className="fw-bold" onClick={() => {
                                        if (window.confirm(`Permanently delete ${editingBrandAdmin?.name}?`)) {
                                            handleConfirmDeletePlatform();
                                            setEditingBrandAdmin(null);
                                        }
                                    }}>Delete</Button>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="d-flex flex-column h-100 p-4 rounded-4 shadow-inner" style={{ backgroundColor: '#0B0E14', border: '1px solid #1a1e24' }}>
                                    <span className="small fw-bold text-info uppercase mb-3 opacity-75" style={{ letterSpacing: '0.1em' }}>Live Brand Header Sync</span>
                                    <div className="flex-grow-1 bg-dark rounded-4 border border-secondary border-opacity-20 p-4 d-flex flex-column align-items-center justify-content-center text-center shadow-lg">
                                        <div className="bg-black rounded-3 overflow-hidden mb-4 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '100%', height: '140px', border: '1px solid #24282d' }}>
                                            {editBrandImage ? (<img src={editBrandImage} alt="Logo" className="img-fluid h-100 w-100" style={{ objectFit: 'contain', padding: '1rem' }} />) : (<div className="h4 text-secondary mb-0 opacity-25 italic font-black">BRAND_BANNER</div>)}
                                        </div>
                                        <h4 className="fw-black text-white text-uppercase italic mb-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{editBrandName || "Brand Name"}</h4>
                                        <div className="text-info small fw-bold text-uppercase mb-3" style={{ fontSize: '10px', letterSpacing: '0.2em' }}>Hardware Repository</div>
                                        <p className="small text-light font-monospace mb-0" style={{ maxHeight: '120px', overflowY: 'auto', lineHeight: '1.6', opacity: 0.8, whiteSpace: 'pre-wrap' }}>{editBrandOverview || "Awaiting administrative documentation sync..."}</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>

                {/* MODEL EDIT MODAL */}
                <Modal show={!!editingModelAdmin} onHide={() => setEditingModelAdmin(null)} size="xl" centered>
                    <Modal.Header closeButton closeVariant="dark" className="bg-white border-bottom shadow-sm">
                        <Modal.Title className="fw-bold text-uppercase h6 letter-spacing-1 text-dark">Board Model Configuration</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light p-0">
                        <Row className="g-0">
                            {/* Editor Panel */}
                            <Col lg={4} className="p-4 p-md-5 bg-white shadow-sm" style={{ zIndex: 1 }}>
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <div className="bg-info" style={{ width: '4px', height: '20px', borderRadius: '2px' }}></div>
                                    <h6 className="text-dark fw-bold text-uppercase small letter-spacing-1 mb-0">Registry Data Entry</h6>
                                </div>
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-secondary text-uppercase mb-2">Model Designation</Form.Label>
                                    <Form.Control type="text" className="bg-light text-dark border-secondary border-opacity-25 p-3 h5 fw-bold font-monospace mb-0" style={{ borderRadius: '12px' }} value={editModelName} onChange={e => setEditModelName(e.target.value)} />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-secondary text-uppercase mb-2">Technical Readout (Description)</Form.Label>
                                    <Form.Control as="textarea" rows={6} className="bg-light text-dark border-secondary border-opacity-25 p-3 small" style={{ borderRadius: '12px', resize: 'none' }} value={editModelDesc} onChange={e => setEditModelDesc(e.target.value)} />
                                </Form.Group>
                                <Form.Group className="mb-5">
                                    <Form.Label className="small fw-bold text-muted uppercase mb-2">Model Image Assets</Form.Label>
                                    <Form.Control type="file" className="bg-light border-0" onChange={(e: any) => e.target.files[0] && editingModelAdmin?.id && handleImageUpload('models', editingModelAdmin.id, e.target.files[0])} disabled={isActionLoading} />
                                    {isActionLoading && <div className="mt-2 small text-info d-flex align-items-center gap-2"><Spinner animation="border" size="sm" /> <span>Syncing to persistent storage...</span></div>}
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button variant="info" className="w-100 fw-bold py-3 uppercase shadow-lg text-white" style={{ borderRadius: '14px', letterSpacing: '0.05em' }} onClick={handleUpdateModelAdvanced} disabled={isModelSaving}>
                                        {isModelSaving ? <Spinner animation="border" size="sm" /> : 'Apply Changes To Registry'}
                                    </Button>
                                    <Button variant="outline-danger" className="fw-bold px-4" style={{ borderRadius: '14px' }} onClick={() => {
                                        if (window.confirm(`Permanently delete model "${editingModelAdmin?.name}"?`)) {
                                            handleConfirmDeleteModel();
                                        }
                                    }} disabled={isModelSaving}>
                                        Delete
                                    </Button>
                                </div>
                            </Col>

                            {/* Live Preview Panel (Simplified Model Card) */}
                            <Col lg={8} className="p-4 p-md-5 d-flex align-items-center justify-content-center" style={{ background: '#0B0E14', minHeight: '600px' }}>
                                <div className="w-100" style={{ maxWidth: '850px' }}>
                                    {/* The Featured Model Card - Focused Preview */}
                                    <Card className="featured-model-card border-0 p-4 shadow-lg">
                                        <Row className="align-items-center g-4">
                                            <Col md={7}>
                                                <div className="bg-black rounded-4 border border-secondary border-opacity-50 p-2 d-flex align-items-center justify-content-center shadow-sm overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                                    {editModelImage && !editModelImage.includes('No+Image') ? (
                                                        <img src={editModelImage} alt="Model" className="img-fluid w-100" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                                    ) : (
                                                        <div className="display-1 text-secondary opacity-10 italic fw-black text-center">X</div>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={5}>
                                                <h2 className="text-white fw-black text-uppercase italic mb-4" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{editModelName || "MODEL_NAME"}</h2>
                                                <div>
                                                    <div className="text-info text-uppercase fw-bold small text-tracking-widest mb-3" style={{ fontSize: '11px', opacity: 0.8 }}>Tech Readout</div>
                                                    <p className="text-white font-monospace mb-0" style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                                                        {editModelDesc?.trim() || "Awaiting entry..."}
                                                    </p>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </div>
                            </Col>

                        </Row>
                    </Modal.Body>
                </Modal>

                {/* Attribute Merge Modal */}
                <Modal show={showAttributeMergeModal} onHide={() => setShowAttributeMergeModal(false)} size="sm" data-bs-theme="dark" centered>
                    <Modal.Header closeButton className="bg-dark border-secondary text-light">
                        <Modal.Title className="fw-bold small text-uppercase letter-spacing-1">Merge Attribute Key</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-dark text-light border-0 p-4">
                        <div className="mb-3">
                            <label className="extreme-small text-muted uppercase fw-bold mb-2 d-block">Target Key</label>
                            <div className="p-3 bg-black rounded border border-secondary text-info font-monospace fw-bold small">{targetAttributeKey}</div>
                        </div>
                        <div className="mb-4">
                            <label className="extreme-small text-muted uppercase fw-bold mb-2 d-block">New Key Name</label>
                            <Form.Control 
                                className="input-contrast p-2" 
                                placeholder="e.g. Total Weight"
                                value={newAttributeKey}
                                onChange={e => setNewAttributeKey(e.target.value)}
                            />
                        </div>
                        <Button variant="info" className="w-100 fw-bold py-2 border-0 shadow" onClick={handleMergeAttributes} disabled={isMergingAttributes || !newAttributeKey.trim()}>
                            {isMergingAttributes ? <Spinner size="sm" animation="border" /> : 'Confirm Merge'}
                        </Button>
                    </Modal.Body>
                </Modal>
            </Container>
            <SiteFooter />
        </div>
    );
}
