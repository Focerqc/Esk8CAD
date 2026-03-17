import React, { useState, useEffect, Dispatch, SetStateAction } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge, InputGroup, OverlayTrigger, Popover } from "react-bootstrap"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import SiteFooter from "../components/SiteFooter"
import SiteNavbar from "../components/SiteNavbar"
import SiteMetaData from "../components/SiteMetaData"
import ClientOnly from "../components/ClientOnly"
import HardwareFields from "../components/Forms/HardwareFields"
import { useBrandHardware } from "../hooks/useBrandHardware"
import { getSupabaseClient } from '../lib/supabase'

// --- Error Boundary ---
interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <Container className="py-5 text-center">
                    <Alert variant="danger" className="py-5 shadow">
                        <h2 className="fw-bold">Something went wrong</h2>
                        <p className="opacity-75">{this.state.error?.message || "A critical error occurred."}</p>
                        <Button variant="outline-danger" onClick={() => window.location.reload()}>Reload Page</Button>
                    </Alert>
                </Container>
            );
        }
        return this.props.children;
    }
}

// --- Taxonomy Interfaces ---
interface Taxonomy {
    id: string;
    name: string;
    template_fields?: any[] | null;
}

// --- Validation Schema ---
const partSchema = z.object({
    id: z.string(), // Internal tracking id for the UI array
    url: z.string().min(3, "Must be a valid link"),
    externalUrl: z.string().max(400, "URL too long").or(z.literal("")),
    title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
    imageSrc: z.string().or(z.literal("")),
    platformId: z.string().min(1, "Please select a manufacturer (platform)"),
    categoryId: z.string().min(1, "Please select a part category"),
    fabricationMethodId: z.string().min(1, "Please select a fabrication method"),
    dropboxUrl: z.string().or(z.literal("")),
    isOem: z.boolean(),
    author: z.string().optional(),
    submittedBy: z.string().optional(),
    modelId: z.string().nullable().optional(), // Can be UUID or custom string
    needsModelReview: z.boolean().optional(),
    attributes: z.record(z.any()).optional()
})

const formSchema = z.object({
    honeypot: z.string().max(0, "Bot detected"), // Should be completely empty
    parts: z.array(partSchema).min(1).max(10, "Maximum 10 parts per submission")
})

type FormValues = z.infer<typeof formSchema>

// --- Sub-Component: PartForm ---
const PartFormItem = ({
    index,
    control,
    remove,
    canRemove,
    watch,
    setValue,
    platforms,
    categories,
    fabricationMethods,
    dimensionUnits,
    setDimensionUnits,
    dimensionTypes,
    setDimensionTypes,
    onUnsavedChange
}: {
    index: number;
    control: any;
    remove: (index: number) => void;
    canRemove: boolean;
    watch: any;
    setValue: any;
    platforms: Taxonomy[];
    categories: Taxonomy[];
    fabricationMethods: Taxonomy[];
    dimensionUnits: Record<string, 'in' | 'mm' | 'cm'>;
    setDimensionUnits: Dispatch<SetStateAction<Record<string, 'in' | 'mm' | 'cm'>>>;
    dimensionTypes: Record<string, 'text' | 'dimension'>;
    setDimensionTypes: Dispatch<SetStateAction<Record<string, 'text' | 'dimension'>>>;
    onUnsavedChange?: (hasUnsaved: boolean) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'category' | 'platform' | 'method' | null>(null)
    const [isScraping, setIsScraping] = useState(false)
    const [showAllAttributes, setShowAllAttributes] = useState(false);
    const [zoomedFields, setZoomedFields] = useState<Record<string, boolean>>({});
    const [hasUnsavedHardware, setHasUnsavedHardware] = useState(false);

    // New Custom Attribute local states
    const [newCustomKey, setNewCustomKey] = useState("");
    const [newCustomType, setNewCustomType] = useState<'text' | 'dimension'>("dimension");
    const [newCustomUnit, setNewCustomUnit] = useState("mm");
    const [newCustomValue, setNewCustomValue] = useState("");

    // Report unsaved state to parent
    useEffect(() => {
        if (onUnsavedChange) {
            const hasUnsavedCustomAttr = (newCustomKey.trim().length > 0 || newCustomValue.trim().length > 0);
            onUnsavedChange(hasUnsavedCustomAttr || hasUnsavedHardware);
        }
    }, [newCustomKey, newCustomValue, hasUnsavedHardware, onUnsavedChange]);

    // Watch fields for this specific array item
    const partValues = watch(`parts.${index}`)
    const titleValue = partValues?.title || ""
    const urlValue = partValues?.url || ""
    const imageSrcValue = partValues?.imageSrc || ""
    const isOemValue = partValues?.isOem || false
    const selectedPlatformId = partValues?.platformId || ""
    const selectedCategoryId = partValues?.categoryId || ""
    const selectedFabricationMethodId = partValues?.fabricationMethodId || ""
    const authorValue = partValues?.author || ""
    const modelIdValue = partValues?.modelId || null
    const needsModelReviewValue = partValues?.needsModelReview || false

    // Fetch models for this brand to resolve names
    const { models: brandModels } = useBrandHardware(selectedPlatformId)

    const selectedModelName = React.useMemo(() => {
        if (!modelIdValue) return null;
        const found = brandModels.find(m => m.id === modelIdValue);
        return found ? found.name : modelIdValue; // Fallback to ID/Custom Name if not found in fetched list
    }, [brandModels, modelIdValue]);

    const handleFetchMetadata = async () => {
        if (!urlValue) {
            alert("Please enter a url first");
            return;
        }
        setIsScraping(true);
        try {
            const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(urlValue)}`);
            const data = (await response.json()) as any;
            if (data.status === 'success') {
                const metadata = data.data;

                // Title & Author Auto-Parse
                if (!titleValue && metadata.title) {
                    if (metadata.title.includes(" by ")) {
                        const strParts = metadata.title.split(" by ");
                        setValue(`parts.${index}.title`, strParts[0].trim(), { shouldValidate: true });
                        if (!authorValue) {
                            let parsedAuthor = strParts.slice(1).join(" by ").trim();
                            if (parsedAuthor.includes(" | ")) {
                                parsedAuthor = parsedAuthor.split(" | ")[0].trim();
                            } else if (parsedAuthor.includes(" - ")) {
                                parsedAuthor = parsedAuthor.split(" - ")[0].trim();
                            }
                            setValue(`parts.${index}.author`, parsedAuthor, { shouldValidate: true });
                        }
                    } else {
                        setValue(`parts.${index}.title`, metadata.title, { shouldValidate: true });
                    }
                }

                if (!imageSrcValue && (metadata.image?.url || metadata.logo?.url)) setValue(`parts.${index}.imageSrc`, metadata.image?.url || metadata.logo?.url, { shouldValidate: true });
                if (!partValues?.externalUrl) setValue(`parts.${index}.externalUrl`, urlValue, { shouldValidate: true });
            }
        } catch (e) {
            console.error("Scraper Error:", e);
            alert("Failed to fetch metadata. Please enter manually.");
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <Card className="bg-dark text-light border-secondary shadow-lg mb-5 part-form-card">
            <Card.Header className="bg-secondary border-0 p-4 d-flex justify-content-between align-items-center">
                <h4 className="mb-0 fs-5 fw-bold uppercase letter-spacing-1">Part #{index + 1}</h4>
                {canRemove && (
                    <Button variant="outline-danger" size="sm" onClick={() => remove(index)}>Remove</Button>
                )}
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
                {/* 1. Primary URL Input */}
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold fs-5">Project Link (cad_link) *</Form.Label>
                    <InputGroup>
                        <Controller
                            control={control}
                            name={`parts.${index}.url`}
                            render={({ field, fieldState }) => (
                                <>
                                    <Form.Control
                                        {...field}
                                        type="url"
                                        placeholder="Paste Printables or Thingiverse URL here"
                                        className={`input-contrast text-white p-3 shadow-sm ${fieldState.error ? 'is-invalid border-danger' : 'border-secondary'}`}
                                    />
                                </>
                            )}
                        />
                        <Button
                            type="button"
                            variant="primary"
                            className="fw-bold px-4 border-secondary"
                            disabled={isScraping || !urlValue}
                            onClick={handleFetchMetadata}
                        >
                            {isScraping ? <Spinner animation="border" size="sm" /> : 'Fetch Metadata'}
                        </Button>
                    </InputGroup>
                    <Controller
                        control={control}
                        name={`parts.${index}.url`}
                        render={({ fieldState }) => (
                            fieldState.error ? <div className="text-danger small mt-1 fw-bold">{fieldState.error.message}</div> : <></>
                        )}
                    />
                </Form.Group>

                {/* 2. OEM Checkbox */}
                <div className="d-flex align-items-center gap-3 mb-4">
                    <Controller
                        control={control}
                        name={`parts.${index}.isOem`}
                        render={({ field }) => (
                            <Form.Check
                                type="checkbox"
                                id={`oem-check-${partValues.id}`}
                                label="OEM PART"
                                className="fw-bold text-primary"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                            />
                        )}
                    />
                </div>

                <hr className="my-5 border-secondary opacity-25" />

                {/* 3. Text Metadata */}
                <Row className="gx-5">
                    <Col md={7}>
                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Title *</Form.Label>
                            <Controller
                                control={control}
                                name={`parts.${index}.title`}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm ${fieldState.error ? 'is-invalid border-danger' : 'border-secondary'}`}
                                        />
                                        <div className="d-flex justify-content-between mt-1">
                                            {fieldState.error ? <span className="text-danger small fw-bold">{fieldState.error.message}</span> : <span></span>}
                                            <span className="small text-muted">{titleValue.length}/150</span>
                                        </div>
                                    </>
                                )}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Image URL</Form.Label>
                            <Controller
                                control={control}
                                name={`parts.${index}.imageSrc`}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm ${fieldState.error ? 'is-invalid border-danger' : 'border-secondary'}`}
                                        />
                                        {fieldState.error && <div className="text-danger small mt-1 fw-bold">{fieldState.error.message}</div>}
                                    </>
                                )}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">External URL</Form.Label>
                            <Controller
                                control={control}
                                name={`parts.${index}.externalUrl`}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm ${fieldState.error ? 'is-invalid border-danger' : 'border-secondary'}`}
                                            placeholder="Auto-filled via scraper or custom URL"
                                        />
                                        {fieldState.error && <div className="text-danger small mt-1 fw-bold">{fieldState.error.message}</div>}
                                    </>
                                )}
                            />
                        </Form.Group>

                        {/* New Optional Text Fields */}
                        <div className="d-flex gap-3 mb-4">
                            <Form.Group className="flex-fill">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Model Author (Optional)</Form.Label>
                                <Controller
                                    control={control}
                                    name={`parts.${index}.author`}
                                    render={({ field }) => (
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm border-secondary`}
                                            placeholder="e.g. John Doe"
                                        />
                                    )}
                                />
                            </Form.Group>

                            <Form.Group className="flex-fill">
                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Submitted By (Optional)</Form.Label>
                                <Controller
                                    control={control}
                                    name={`parts.${index}.submittedBy`}
                                    render={({ field }) => (
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm border-secondary`}
                                            placeholder="Your Name (Empty = Anonymous)"
                                        />
                                    )}
                                />
                            </Form.Group>
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className="bg-black rounded border border-secondary overflow-hidden position-relative shadow-inner" style={{ width: '100%', paddingBottom: '75%' }}>
                            {imageSrcValue && <Image src={imageSrcValue} className="position-absolute w-100 h-100 p-2" style={{ objectFit: 'contain' }} />}
                            {!imageSrcValue && <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-muted small">No Image Preview</div>}
                        </div>
                    </Col>
                </Row>

                {/* 4. Taxonomy Selectors */}
                <div className="my-5">

                    <div className="d-flex flex-wrap gap-2 mb-2">
                        <Button className={`taxonomy-btn ${activeTab === 'platform' ? 'active' : ''}`} onClick={() => setActiveTab(activeTab === 'platform' ? null : 'platform')}>Manufacturer (Platform) *</Button>
                        <Button className={`taxonomy-btn ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab(activeTab === 'category' ? null : 'category')}>Part Category *</Button>
                        <Button className={`taxonomy-btn ${activeTab === 'method' ? 'active' : ''}`} onClick={() => setActiveTab(activeTab === 'method' ? null : 'method')}>Fabrication Method *</Button>
                    </div>

                    <div className={`mt-3 p-4 rounded bg-secondary border border-secondary shadow-sm ${!activeTab ? 'd-none' : ''}`}>
                        {activeTab === 'category' && (
                            <div className="d-flex flex-wrap gap-2">
                                {categories.map(opt => (
                                    <Badge
                                        key={opt.id}
                                        bg={selectedCategoryId === opt.id ? "primary" : "none"}
                                        className="p-2 border border-light cursor-pointer shadow-sm"
                                        onClick={() => {
                                            setValue(`parts.${index}.categoryId`, opt.id, { shouldValidate: true });
                                            setValue(`parts.${index}.attributes`, {}); // Clear attributes when category changes
                                            setZoomedFields({}); // Reset zoom states
                                        }}
                                    >
                                        {opt.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {activeTab === 'platform' && (() => {
                            const pinnedStreet = platforms.find(p => p.name === "Street (DIY/Generic)");
                            const pinnedOffroad = platforms.find(p => p.name === "Off-Road (DIY/Generic)");
                            const pinnedMisc = platforms.find(p => p.name === "Misc");

                            const others = platforms
                                .filter(p => !["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc"].includes(p.name))
                                .sort((a, b) => a.name.localeCompare(b.name));

                            const group1 = others.filter(p => { const first = p.name[0].toUpperCase(); return (first >= '0' && first <= '9') || (first >= 'A' && first <= 'I'); });
                            const group2 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'J' && first <= 'R'; });
                            const group3 = others.filter(p => { const first = p.name[0].toUpperCase(); return first >= 'S' && first <= 'Z'; });

                            return (
                                <>
                                    <Row className="g-3 mb-4">
                                        <Col xs={12} lg={4}>
                                            {pinnedStreet && (
                                                <Badge
                                                    bg={selectedPlatformId === pinnedStreet.id ? "primary" : "none"}
                                                    className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                    style={{ fontSize: "0.85rem" }}
                                                    onClick={() => { setValue(`parts.${index}.platformId`, pinnedStreet.id, { shouldValidate: true }); setActiveTab(null); }}
                                                >
                                                    {pinnedStreet.name}
                                                </Badge>
                                            )}
                                        </Col>
                                        <Col xs={12} lg={4}>
                                            {pinnedOffroad && (
                                                <Badge
                                                    bg={selectedPlatformId === pinnedOffroad.id ? "primary" : "none"}
                                                    className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                    style={{ fontSize: "0.85rem" }}
                                                    onClick={() => { setValue(`parts.${index}.platformId`, pinnedOffroad.id, { shouldValidate: true }); setActiveTab(null); }}
                                                >
                                                    {pinnedOffroad.name}
                                                </Badge>
                                            )}
                                        </Col>
                                        <Col xs={12} lg={4}>
                                            {pinnedMisc && (
                                                <Badge
                                                    bg={selectedPlatformId === pinnedMisc.id ? "primary" : "none"}
                                                    className="p-3 border border-light cursor-pointer shadow-sm w-100 uppercase text-wrap lh-sm h-100 d-flex align-items-center justify-content-center"
                                                    style={{ fontSize: "0.85rem" }}
                                                    onClick={() => { setValue(`parts.${index}.platformId`, pinnedMisc.id, { shouldValidate: true }); setActiveTab(null); }}
                                                >
                                                    {pinnedMisc.name}
                                                </Badge>
                                            )}
                                        </Col>
                                    </Row>

                                    <h3 className="h6 fw-bold text-light mb-3 uppercase letter-spacing-1 border-bottom border-secondary pb-2">Brands</h3>

                                    <Row className="g-4">
                                        <Col xs={12} lg={4} className="d-flex flex-column gap-2">
                                            <div className="text-center mb-1">
                                                <span className="small fw-bold text-light uppercase letter-spacing-1">A - I</span>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2">
                                                {group1.map(opt => (
                                                    <Badge
                                                        key={opt.id}
                                                        bg={selectedPlatformId === opt.id ? "primary" : "none"}
                                                        className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm"
                                                        style={{ minWidth: "46%" }}
                                                        onClick={() => { setValue(`parts.${index}.platformId`, opt.id, { shouldValidate: true }); setActiveTab(null); }}
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
                                                        bg={selectedPlatformId === opt.id ? "primary" : "none"}
                                                        className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm"
                                                        style={{ minWidth: "46%" }}
                                                        onClick={() => { setValue(`parts.${index}.platformId`, opt.id, { shouldValidate: true }); setActiveTab(null); }}
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
                                                        bg={selectedPlatformId === opt.id ? "primary" : "none"}
                                                        className="p-2 border border-light cursor-pointer shadow-sm flex-fill d-flex align-items-center justify-content-center text-wrap lh-sm"
                                                        style={{ minWidth: "46%" }}
                                                        onClick={() => { setValue(`parts.${index}.platformId`, opt.id, { shouldValidate: true }); setActiveTab(null); }}
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

                        {activeTab === 'method' && (
                            <div className="d-flex flex-wrap gap-2">
                                {fabricationMethods.map(opt => (
                                    <Badge
                                        key={opt.id}
                                        bg={selectedFabricationMethodId === opt.id ? "primary" : "none"}
                                        className="p-2 border border-light cursor-pointer shadow-sm"
                                        onClick={() => setValue(`parts.${index}.fabricationMethodId`, opt.id, { shouldValidate: true })}
                                    >
                                        {opt.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Controller
                        control={control}
                        name={`parts.${index}.categoryId`}
                        render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                    />
                    <Controller
                        control={control}
                        name={`parts.${index}.platformId`}
                        render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                    />
                    <Controller
                        control={control}
                        name={`parts.${index}.fabricationMethodId`}
                        render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                    />

                    {/* Taxonomy Summary Pills */}
                    <div className="mt-4 p-3 rounded-pill bg-black border border-secondary d-flex align-items-center justify-content-center gap-2 flex-wrap shadow-inner" style={{ minHeight: '52px' }}>
                        {!selectedPlatformId && !selectedFabricationMethodId && !selectedCategoryId && !isOemValue ? (
                            <span className="small text-muted opacity-50 italic">No tags selected yet...</span>
                        ) : (
                            <>
                                {isOemValue && <Badge bg="none" className="px-3 py-2 border rounded-pill uppercase small" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>OEM</Badge>}
                                {selectedPlatformId && <Badge bg="primary" className="px-3 py-2 rounded-pill uppercase small">{platforms.find(p => p.id === selectedPlatformId)?.name || 'Platform'}</Badge>}
                                {modelIdValue && (
                                    <Badge
                                        bg={needsModelReviewValue ? "warning" : "light"}
                                        text="dark"
                                        className="px-3 py-2 border rounded-pill uppercase small border-secondary"
                                    >
                                        {needsModelReviewValue ? `🚩 ${modelIdValue}` : selectedModelName}
                                    </Badge>
                                )}
                                {selectedCategoryId && <Badge bg="none" className="px-3 py-2 border border-success text-success rounded-pill uppercase small" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>{categories.find(c => c.id === selectedCategoryId)?.name || 'Category'}</Badge>}
                                {selectedFabricationMethodId && <Badge bg="none" className="px-3 py-2 border border-primary text-primary rounded-pill uppercase small" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>{fabricationMethods.find(f => f.id === selectedFabricationMethodId)?.name || 'Method'}</Badge>}
                            </>
                        )}
                    </div>

                    {/* Dynamic Attributes Block */}
                    {(() => {
                        const activeCategory = categories.find(c => c.id === selectedCategoryId);
                        const templateFields = activeCategory?.template_fields;
                        
                        if (selectedCategoryId) {
                            return (
                                <div className="mt-4 p-4 rounded bg-black border border-secondary shadow-sm">
                                    <h5 className="fw-bold text-light uppercase letter-spacing-1 mb-4">Attributes / Specifications</h5>
                                    
                                    {templateFields && templateFields.length > 0 && (() => {
                                        const primaryFields = templateFields.filter((f: any) => f.is_primary);
                                        const secondaryFields = templateFields.filter((f: any) => !f.is_primary);
                                        
                                        // If no fields are marked primary at all, treat them all as primary for this view
                                        const visibleFields = primaryFields.length > 0 ? primaryFields : templateFields;
                                        const hiddenFields = primaryFields.length > 0 ? secondaryFields : [];

                                        const renderField = (fieldDef: any) => (
                                            <div key={fieldDef.key} className="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary border-opacity-10">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Form.Label className="small uppercase fw-bold opacity-75 text-light mb-0">
                                                        {fieldDef.key} {fieldDef.unit ? <span className="text-primary">({fieldDef.unit})</span> : ''}
                                                    </Form.Label>
                                                </div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div style={{ width: fieldDef.type === 'dimension' ? '240px' : '180px' }} className="d-flex align-items-center">
                                                        <Controller
                                                            control={control}
                                                            name={`parts.${index}.attributes.${fieldDef.key}` as any}
                                                            render={({ field }) => (
                                                                <div className="input-group input-group-sm">
                                                                    <Form.Control
                                                                        {...field}
                                                                        type={(fieldDef.type === 'dimension') ? 'number' : 'text'}
                                                                        step="any"
                                                                        placeholder={fieldDef.placeholder || (fieldDef.type === 'dimension' ? "44" : "")}
                                                                        value={field.value || ""}
                                                                        className="input-contrast text-white p-2 shadow-sm border-secondary text-end"
                                                                        style={{ borderRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                                                    />
                                                                    {fieldDef.type === 'dimension' && (
                                                                        <Button 
                                                                            variant="outline-secondary" 
                                                                            size="sm" 
                                                                            className="fw-bold extreme-small border-secondary border-start-0" 
                                                                            style={{ minWidth: '40px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, backgroundColor: 'transparent', color: '#06b6d4' }}
                                                                            onClick={() => {
                                                                                const current = dimensionUnits[`${index}-${fieldDef.key}`] || 'mm';
                                                                                const next = current === 'mm' ? 'cm' : current === 'cm' ? 'in' : 'mm';
                                                                                setDimensionUnits(prev => ({
                                                                                    ...prev,
                                                                                    [`${index}-${fieldDef.key}`]: next
                                                                                }));
                                                                            }}
                                                                        >
                                                                            {dimensionUnits[`${index}-${fieldDef.key}`] || 'mm'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
                                                    {fieldDef.diagram_url ? (
                                                        <div 
                                                            className="rounded border border-secondary border-opacity-10 shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-white position-relative" 
                                                            style={{ 
                                                                width: zoomedFields[fieldDef.key] ? '240px' : '120px', 
                                                                height: zoomedFields[fieldDef.key] ? '240px' : '120px', 
                                                                flexShrink: 0,
                                                                transition: 'all 0.2s ease-in-out',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setZoomedFields(prev => ({ ...prev, [fieldDef.key]: !prev[fieldDef.key] }))}
                                                            title="Click to toggle zoom"
                                                        >
                                                            <img 
                                                                src={fieldDef.diagram_url} 
                                                                alt="Guide" 
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                                            />
                                                            <div 
                                                                className="position-absolute bottom-0 end-0 p-1 opacity-0 hover-opacity-100 transition-opacity"
                                                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }}
                                                            >
                                                                <span className="text-white extreme-small fw-bold px-1">{zoomedFields[fieldDef.key] ? '×1' : '🔍'}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '120px', height: '120px' }} />
                                                    )}
                                                </div>
                                            </div>
                                        );

                                        return (
                                            <div className="d-flex flex-column gap-1 mb-4">
                                                {visibleFields.map(renderField)}
                                                
                                                {hiddenFields.length > 0 && (
                                                    <div className="mt-2">
                                                        {showAllAttributes && hiddenFields.map(renderField)}
                                                        <Button 
                                                            variant="link" 
                                                            className="text-info extreme-small fw-bold text-decoration-none p-0 mt-2 opacity-75 hover-opacity-100"
                                                            onClick={() => setShowAllAttributes(!showAllAttributes)}
                                                        >
                                                            {showAllAttributes ? '↑ HIDE OPTIONAL FIELDS' : `↓ EXPAND FULL LIST OF ${categories.find(c => c.id === selectedCategoryId)?.name.toUpperCase() || 'PART'} ATTRIBUTES`}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    
                                    <div className={templateFields && templateFields.length > 0 ? "pt-4 border-top border-secondary mt-2" : ""}>
                                        <h6 className="fw-bold text-light small uppercase opacity-75 mb-2">Custom Attributes</h6>
                                        <p className="small text-muted mb-3 opacity-50 text-wrap">Add any specifications that don't fit the category templates.</p>
                                        <Controller
                                            control={control}
                                            name={`parts.${index}.attributes` as any}
                                            render={({ field }) => {
                                                const currentAttrs = field.value || {};
                                                const customKeys = Object.keys(currentAttrs).filter(k => !(templateFields || []).find((tf: any) => tf.key === k));
                                                return (
                                                    <div className="d-flex flex-column gap-2 mb-2">
                                                        {customKeys.map(k => {
                                                            const isDim = dimensionTypes[`${index}-${k}`] === 'dimension';
                                                            const unit = dimensionUnits[`${index}-${k}`] || ''; // Default to empty string if no unit
                                                            return (
                                                                <div key={k} className="bg-secondary bg-opacity-10 p-2 rounded d-flex justify-content-between align-items-center border border-secondary border-opacity-25 shadow-sm mb-1">
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <Badge bg={isDim ? "info" : "secondary"} className={`${isDim ? 'text-dark' : 'text-light'} extreme-small px-2 py-1`}>{isDim ? 'DIMENSION' : 'OTHER UNITS'}</Badge>
                                                                        <span className="text-white small fw-bold">{k}:</span>
                                                                        <span className="text-info small">{currentAttrs[k]} {unit && <span className="text-muted ms-1 italic" style={{ fontSize: '0.7rem' }}>{unit}</span>}</span>
                                                                    </div>
                                                                    <Button variant="link" className="text-danger p-0 px-2 text-decoration-none fw-bold hover-opacity-100 opacity-50" onClick={() => {
                                                                        const newAttrs = { ...currentAttrs };
                                                                        delete newAttrs[k];
                                                                        field.onChange(newAttrs);
                                                                    }}>×</Button>
                                                                </div>
                                                            );
                                                        })}

                                                        <div className="p-3 bg-black bg-opacity-25 rounded border border-secondary border-opacity-25 mt-2 shadow-sm">
                                                            <h6 className="text-info extreme-small fw-bold text-uppercase mb-3 italic">Add Custom Specification</h6>
                                                            <Row className="g-2">
                                                                <Col md={3}>
                                                                    <Form.Control 
                                                                        placeholder="Key (e.g. Weight)" 
                                                                        className="input-contrast p-2 small border-secondary" 
                                                                        value={newCustomKey}
                                                                        onChange={e => setNewCustomKey(e.target.value)}
                                                                    />
                                                                </Col>
                                                                <Col md={3}>
                                                                    <Form.Select 
                                                                        className="input-contrast p-2 small border-secondary"
                                                                        value={newCustomType}
                                                                        onChange={e => {
                                                                            const val = e.target.value as 'text' | 'dimension';
                                                                            setNewCustomType(val);
                                                                            if (val === 'text') setNewCustomUnit("" as any);
                                                                        }}
                                                                    >
                                                                        <option value="dimension">Dimension</option>
                                                                        <option value="text">Other Units</option>
                                                                    </Form.Select>
                                                                </Col>
                                                                <Col md={2} className="position-relative">
                                                                    {newCustomType === 'dimension' && (
                                                                        <div className="d-flex gap-1 position-absolute" style={{ top: '-18px', left: '8px', zIndex: 10 }}>
                                                                            {['mm', 'cm', 'in'].map(u => (
                                                                                <Badge key={u} bg="secondary" className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => setNewCustomUnit(u)}>{u}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {newCustomType === 'text' && (
                                                                        <div className="d-flex gap-1 position-absolute" style={{ top: '-18px', left: '8px', width: 'max-content', zIndex: 10 }}>
                                                                            {['kg', 'lb', 'V', 'Wh', 'kv', 'T'].map(u => (
                                                                                <Badge key={u} bg="secondary" className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => setNewCustomUnit(u)}>{u}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <Form.Control 
                                                                        placeholder="Unit" 
                                                                        className="input-contrast p-2 small border-secondary text-center" 
                                                                        value={newCustomUnit}
                                                                        onChange={e => setNewCustomUnit(e.target.value as any)}
                                                                    />
                                                                </Col>
                                                                <Col md={3}>
                                                                    <InputGroup size="sm">
                                                                        <Form.Control 
                                                                            type={newCustomType === 'dimension' ? "number" : "text"}
                                                                            step="any"
                                                                            placeholder="Value..." 
                                                                            className="input-contrast p-2 small border-secondary text-end" 
                                                                            value={newCustomValue}
                                                                            onChange={e => setNewCustomValue(e.target.value)}
                                                                            style={(newCustomType === 'dimension' || newCustomUnit) ? { borderRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}}
                                                                        />
                                                                        {(newCustomType === 'dimension' || newCustomUnit) && (
                                                                            <InputGroup.Text className="input-contrast border-secondary border-start-0 text-info opacity-75 extreme-small fw-bold" style={{ backgroundColor: 'transparent' }}>
                                                                                {newCustomUnit || (newCustomType === 'dimension' ? 'mm' : '')}
                                                                            </InputGroup.Text>
                                                                        )}
                                                                    </InputGroup>
                                                                </Col>
                                                                <Col md={2}>
                                                                    <Button 
                                                                        variant="info" 
                                                                        className="w-100 fw-bold small py-2 shadow-sm"
                                                                        onClick={() => {
                                                                            if (newCustomKey.trim() && newCustomValue.trim()) {
                                                                                setDimensionTypes(prev => ({ ...prev, [`${index}-${newCustomKey.trim()}`]: newCustomType }));
                                                                                if (newCustomType === 'dimension') {
                                                                                    setDimensionUnits(prev => ({ ...prev, [`${index}-${newCustomKey.trim()}`]: newCustomUnit as any }));
                                                                                }
                                                                                field.onChange({ ...currentAttrs, [newCustomKey.trim()]: newCustomValue.trim() });
                                                                                setNewCustomKey("");
                                                                                setNewCustomValue("");
                                                                            }
                                                                        }}
                                                                    >ADD</Button>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>

                {/* 5. Additional / Minor Selectors */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Mirror Link</Form.Label>
                            <Controller
                                control={control}
                                name={`parts.${index}.dropboxUrl`}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Form.Control
                                            {...field}
                                            className={`input-contrast text-white p-3 shadow-sm ${fieldState.error ? 'is-invalid border-danger' : 'border-secondary'}`}
                                            placeholder="Auto-filled via scraper or custom URL"
                                        />
                                        {fieldState.error && <div className="text-danger small mt-1 fw-bold">{fieldState.error.message}</div>}
                                    </>
                                )}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <HardwareFields
                    brandId={selectedPlatformId}
                    modelId={modelIdValue}
                    needsModelReview={needsModelReviewValue}
                    onChangeModel={(m) => setValue(`parts.${index}.modelId`, m, { shouldValidate: true })}
                    onChangeNeedsReview={(b) => setValue(`parts.${index}.needsModelReview`, b, { shouldValidate: true })}
                    onUnsavedChange={(val) => setHasUnsavedHardware(val)}
                />
            </Card.Body>
        </Card>
    )
}

// --- Main Component: SubmitPage ---
const SubmitPage: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState<string>('')

    const [platforms, setPlatforms] = useState<Taxonomy[]>([])
    const [categories, setCategories] = useState<Taxonomy[]>([])
    const [fabricationMethods, setFabricationMethods] = useState<Taxonomy[]>([])
    const [isTaxonomyLoading, setIsTaxonomyLoading] = useState(true)
    const [dimensionUnits, setDimensionUnits] = useState<Record<string, 'in' | 'mm' | 'cm'>>({})
    const [dimensionTypes, setDimensionTypes] = useState<Record<string, 'text' | 'dimension'>>({})

    // Setup React Hook Form native integration
    const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            honeypot: "", // Empty to start
            parts: [{
                id: Math.random().toString(36).substr(2, 9),
                url: "",
                externalUrl: "",
                title: "",
                imageSrc: "",
                platformId: "",
                categoryId: "",
                fabricationMethodId: "",
                dropboxUrl: "",
                isOem: false,
                author: "",
                submittedBy: "",
                modelId: null,
                needsModelReview: false,
                attributes: {}
            }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "parts"
    })

    // Fetch Taxonomy on mount
    useEffect(() => {
        let isMounted = true;
        const fetchTaxonomy = async () => {
            const client = getSupabaseClient();
            if (!client) {
                if (isMounted) setIsTaxonomyLoading(false);
                return; // SSR or missing config
            }
            try {
                const { data: pData } = await client.from('brands').select('id, name').order('name');
                const { data: catData } = await client.from('part_categories').select('id, name, template_fields').order('name');
                const { data: fData } = await client.from('fabrication_methods').select('id, name').order('name');
                if (isMounted) {
                    if (pData && pData.length > 0) setPlatforms(pData);
                    if (catData && catData.length > 0) setCategories(catData);
                    if (fData && fData.length > 0) setFabricationMethods(fData);
                }
            } catch (err) {
                console.error("Failed to fetch taxonomy:", err);
            } finally {
                if (isMounted) setIsTaxonomyLoading(false);
            }
        };
        fetchTaxonomy();
        return () => { isMounted = false; }
    }, []);

    // Form submission handler
    const onSubmit = async (data: FormValues) => {
        // 1. Silent Spam Check (Honeypot)
        if (data.honeypot) {
            console.warn("Spam bot detected via honeypot field. Silently aborting.");
            reset();
            setStatus('success');
            setMessage("Part(s) submitted for review.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setStatus('submitting')
        setMessage('')

        try {
            const client = getSupabaseClient();
            if (!client) throw new Error("Supabase client failed to initialize.");

            const processedParts = [];

            // Parallel individual processing in case of new models
            for (let i = 0; i < data.parts.length; i++) {
                const p = data.parts[i];
                let finalModelId = p.modelId;

                // Handle New Board Model Insertion
                if (p.needsModelReview && p.modelId && p.platformId) {
                    // It's a string, not a UUID
                    const modelName = p.modelId.trim();
                    const brandObj = (platforms as any[]).find(plat => plat.id === p.platformId);
                    const brandPrefix = brandObj ? `${brandObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-` : '';

                    const genSlug = (n: string) => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    const modelSlug = `${brandPrefix}${genSlug(modelName)}`;

                    const { data: newModel, error: modelError } = await client
                        .from('models')
                        .insert([{
                            name: modelName,
                            brand_id: p.platformId,
                            slug: modelSlug
                        }])
                        .select()
                        .single();

                    if (!modelError && newModel) {
                        finalModelId = newModel.id;
                    } else {
                        console.warn("Model insertion failed:", modelError);
                        // Fallback: we'll store it as a string in board_model below
                    }
                }

                // normalize urls
                const normalizeUrl = (u: string) => {
                    if (!u) return null;
                    const trimmed = u.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith('http') || trimmed.startsWith('//')) return trimmed;
                    if (trimmed.includes('.')) return `https://${trimmed}`;
                    return trimmed;
                };

                processedParts.push({
                    title: p.title,
                    platform_id: p.platformId,
                    category_id: p.categoryId,
                    fabrication_method_id: p.fabricationMethodId,
                    external_url: normalizeUrl(p.externalUrl) || normalizeUrl(p.url),
                    image_src: normalizeUrl(p.imageSrc) || null,
                    dropbox_url: normalizeUrl(p.dropboxUrl) || null,
                    is_oem: p.isOem,
                    author: p.author || null,
                    submitted_by: p.submittedBy && p.submittedBy.trim().length > 0 ? p.submittedBy.trim() : 'Anonymous',
                    model_id: (finalModelId && finalModelId.length === 36) ? finalModelId : null,
                    board_model: (!finalModelId || finalModelId.length !== 36) ? finalModelId : null,
                    needs_model_review: p.needsModelReview || false,
                    attributes: (() => {
                        const attrs = { ...(p.attributes || {}) };
                        const activeCat = categories.find(c => c.id === p.categoryId);
                        if (activeCat?.template_fields) {
                            activeCat.template_fields.forEach((tf: any) => {
                                if (tf.type === 'dimension') {
                                    const unit = dimensionUnits[`${i}-${tf.key}`] || 'mm';
                                    const val = attrs[tf.key];
                                    if (val) {
                                        const numVal = parseFloat(val);
                                        if (unit === 'in') {
                                            attrs[tf.key] = (numVal * 25.4).toString();
                                        } else if (unit === 'cm') {
                                            attrs[tf.key] = (numVal * 10).toString();
                                        }
                                        attrs[`${tf.key}__unit`] = 'mm'; // Normalized to mm
                                    }
                                } else if (tf.unit) {
                                    // Non-dimension template field with a fixed unit
                                    attrs[`${tf.key}__unit`] = tf.unit;
                                }
                            });
                        }

                        // Also normalize custom attributes that are marked as dimensions or have custom units
                        Object.keys(p.attributes || {}).forEach(k => {
                            const isTemplateField = activeCat?.template_fields?.find((tf: any) => tf.key === k);
                            if (!isTemplateField) {
                                // It's a custom attribute
                                const unit = dimensionUnits[`${i}-${k}`] || '';
                                const type = dimensionTypes[`${i}-${k}`];
                                const val = attrs[k];

                                if (val) {
                                    if (type === 'dimension') {
                                        const numVal = parseFloat(val);
                                        if (unit === 'in') {
                                            attrs[k] = (numVal * 25.4).toString();
                                        } else if (unit === 'cm') {
                                            attrs[k] = (numVal * 10).toString();
                                        }
                                        attrs[`${k}__unit`] = 'mm';
                                    } else if (unit) {
                                        attrs[`${k}__unit`] = unit;
                                    }
                                }
                            }
                        });
                        return attrs;
                    })(),
                    status: 'pending'
                });
            }

            // Send standard anon DB insert
            const { error: insertError } = await client.from('parts').insert(processedParts);

            if (insertError) {
                throw new Error(insertError.message || "Unknown database rejection.");
            }

            setStatus('success');
            setMessage("Part(s) submitted for review directly to the database!");

            // Re-initialize a blank form
            reset({
                honeypot: "",
                parts: [{
                    id: Math.random().toString(36).substr(2, 9),
                    url: "", externalUrl: "", title: "", imageSrc: "", platformId: "",
                    categoryId: "", fabricationMethodId: "", dropboxUrl: "", isOem: false,
                    author: "", submittedBy: "", modelId: null, needsModelReview: false,
                    attributes: {}
                }]
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err: any) {
            console.error("Submission failed:", err);
            setStatus('error');
            setMessage(`Database Error: ${err.message || String(err)}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    const onError = (errors: any) => {
        console.error("ZOD VALIDATION FAILED:", errors);
        setStatus('error');
        setMessage("Please fix the validation errors in the form before submitting.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const [unsavedMap, setUnsavedMap] = useState<Record<string, boolean>>({});

    const isSuccessState = status === 'success';
    const isErrorState = status === 'error';

    return (
        <AppErrorBoundary>
            <div className="bg-black text-light min-vh-100 pb-5 mb-5">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .part-form-card { background: #121417 !important; border: 1px solid #24282d !important; border-radius: 12px !important; overflow: hidden; }
                    .part-form-card .card-header { background: #1a1d20 !important; border-bottom: 1px solid #24282d !important; }
                    .input-contrast { 
                        background-color: #16191d !important; 
                        border: 1px solid #4a4f57 !important; 
                        color: #fff !important; 
                        border-radius: 8px !important;
                        transition: all 0.2s ease;
                    }
                    .input-contrast:focus {
                        background-color: #000 !important;
                        border-color: #00e5ff !important;
                        box-shadow: 0 0 0 0.25rem rgba(0, 229, 255, 0.1) !important;
                        color: #fff !important;
                    }
                    .input-contrast::placeholder { color: rgba(255,255,255,0.4) !important; }
                    
                    /* Force white text on form labels */
                    .form-label { color: #f8f9fa !important; }
                    .text-light { color: #f8f9fa !important; }
                    .text-primary { color: #00e5ff !important; }
                    
                    .letter-spacing-1 { letter-spacing: 0.1em; }
                    .uppercase { text-transform: uppercase; }
                    .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.5) !important; }
                    .border-dashed { border-style: dashed !important; border-width: 2px !important; border-color: #24282d !important; }
                    .border-dashed:hover { border-color: #00e5ff !important; background: rgba(0,229,255,0.02) !important; }
                    .extreme-small { font-size: 0.65rem; }
                `}} />
                <SiteMetaData title="ESK8CAD/Submit" />
                <SiteNavbar />
                <Container className="py-5" style={{ maxWidth: '900px' }}>
                    <header className="text-center mb-5">
                        <h1 className="display-4 fw-bold">Submit Parts</h1>
                        <p className="small text-info uppercase letter-spacing-1 opacity-50 mb-4">Community Contribution Portal</p>
                        <p className="text-light opacity-50">Contribute CAD models to our catalog. Batch up to 10 parts at once.</p>
                    </header>

                    <ClientOnly fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
                        {isTaxonomyLoading ? (
                            <div className="text-center py-5">
                                <Spinner animation="grow" variant="primary" />
                                <p className="mt-3 text-muted">Loading live taxonomy...</p>
                            </div>
                        ) : (
                            <Form onSubmit={handleSubmit(onSubmit, onError)}>

                                {/* TRAP BOT HONEYPOT */}
                                <input type="text" {...control.register("honeypot")} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                                <div style={{ minHeight: '100px' }}>
                                    {isSuccessState ? (
                                        <Alert variant="success" className="mb-5 p-4 border-0 shadow-lg text-center" style={{ backgroundColor: '#0f5132', color: '#fff' }}>
                                            <h4 className="fw-bold mb-2">🚀 Submission Received!</h4>
                                            <p className="mb-3 opacity-75">{message}</p>
                                            <div className="mt-3">
                                                <Button variant="outline-light" size="sm" onClick={() => setStatus('idle')}>Submit More Parts</Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        isErrorState && (
                                            <Alert variant="danger" className="mb-4 border-0 shadow-lg p-4" style={{ backgroundColor: '#842029', color: '#fff' }}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h5 className="mb-1 fw-bold">⚠️ Submission Error</h5>
                                                        <p className="mb-0 opacity-75">{message}</p>
                                                    </div>
                                                    <Button variant="outline-light" size="sm" onClick={() => setStatus('idle')}>Dismiss</Button>
                                                </div>
                                            </Alert>
                                        )
                                    )}
                                </div>

                                {!isSuccessState && (
                                    <>
                                        {fields.map((field, index) => (
                                            <PartFormItem
                                                key={field.id}
                                                index={index}
                                                control={control}
                                                remove={remove}
                                                canRemove={fields.length > 1}
                                                watch={watch}
                                                setValue={setValue}
                                                platforms={platforms}
                                                categories={categories}
                                                fabricationMethods={fabricationMethods}
                                                dimensionUnits={dimensionUnits}
                                                setDimensionUnits={setDimensionUnits}
                                                dimensionTypes={dimensionTypes}
                                                setDimensionTypes={setDimensionTypes}
                                                onUnsavedChange={(val) => setUnsavedMap(prev => ({ ...prev, [field.id]: val }))}
                                            />
                                        ))}

                                        <div className="d-flex flex-column gap-4 mb-5 pb-5">
                                            {fields.length < 10 && (
                                                <Button
                                                    variant="outline-primary"
                                                    size="lg"
                                                    className="py-3 border-dashed"
                                                    onClick={() => append({
                                                        id: Math.random().toString(36).substr(2, 9),
                                                        url: "", externalUrl: "", title: "", imageSrc: "", platformId: "",
                                                        categoryId: "", fabricationMethodId: "", dropboxUrl: "", isOem: false,
                                                        author: "", submittedBy: "", modelId: null, needsModelReview: false,
                                                        attributes: {}
                                                    })}
                                                    disabled={status === 'submitting'}
                                                >
                                                    + Attach Another Link
                                                </Button>
                                            )}

                                            {Object.values(unsavedMap).some(v => v) && (
                                                <Alert variant="warning" className="mb-0 bg-transparent border-warning text-warning d-flex align-items-center gap-3 shadow-sm">
                                                    <div className="fs-4">⚠️</div>
                                                    <div>
                                                        <strong className="d-block">Unsaved Specifications Detected</strong>
                                                        <span className="small opacity-75">You have text in an "Add" field that hasn't been saved yet. Click the <strong>Add</strong> button next to the input before submitting.</span>
                                                    </div>
                                                </Alert>
                                            )}

                                            <Button
                                                type="submit"
                                                variant="success"
                                                size="lg"
                                                className="py-3 fw-bold shadow-lg"
                                                disabled={status === 'submitting'}
                                            >
                                                {status === 'submitting' ? (
                                                    <><Spinner animation="border" size="sm" className="me-2" /> Submitting...</>
                                                ) : 'Submit Sequence to Admin'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        )}
                    </ClientOnly>
                </Container>
                <SiteFooter />
            </div>
        </AppErrorBoundary>
    )
}

export default SubmitPage;
