import 'bootstrap/dist/css/bootstrap.min.css';
const GlobalStyles = () => (
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
);
import { type PageProps } from "gatsby"
import React, { useState, useEffect, useCallback } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge, InputGroup } from "react-bootstrap"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import SiteFooter from "../components/SiteFooter"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"
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
}

const FAB_METHODS = ["3d Printed", "CNC", "Molded", "Other"]

const DEFAULT_PLATFORMS: Taxonomy[] = [
    "Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "3D Servisas", "Acedeck", "Apex Boards",
    "Backfire", "Bioboards", "Boardnamics", "Defiant Board Society", "Evolve", "Exway",
    "Fluxmotion", "Hoyt St", "Lacroix Boards", "Linnpower", "MBoards", "MBS", "Meepo",
    "Newbee", "Propel", "Radium Performance", "Stooge Raceboards", "Summerboard",
    "Trampa Boards", "Wowgo"
].map((name, i) => ({ id: `default-p-${i}`, name }));

const DEFAULT_CATEGORIES: Taxonomy[] = [
    "Anti-sink plate", "Battery", "Battery building parts", "Bearing", "BMS", "Bushing", "Charge Port",
    "Charger case", "Complete board", "Connector", "Cover", "Deck", "Drill hole Jig", "Enclosure",
    "ESC", "Fender", "Foothold / Bindings", "Fuse holder", "Gland", "Guard / Bumper", "Headlight",
    "Heatsink", "Idler", "Motor", "Motor Mount", "Mount", "Pulley", "Remote", "Riser",
    "Shocks / Damper", "Sprocket", "Stand", "Thumbwheel", "Tire", "Truck", "Wheel", "Wheel Hub", "Miscellaneous"
].map((name, i) => ({ id: `default-c-${i}`, name }));

// --- Validation Schema ---
const partSchema = z.object({
    id: z.string(), // Internal tracking id for the UI array
    url: z.string().url("Must be a valid URL (e.g., https://printables.com/...)"),
    externalUrl: z.string().url("Must be a valid URL").max(400, "URL too long").or(z.literal("")),
    title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
    imageSrc: z.string().url("Must be a valid URL").or(z.literal("")),
    platform: z.array(z.string()).min(1, "Select at least 1 manufacturer (platform)").max(1, "Only 1 manufacturer allowed"),
    typeOfPart: z.array(z.string()).min(1, "Select at least 1 category").max(1, "Only 1 category allowed"),
    fabricationMethod: z.array(z.string()).min(1, "Select at least 1 fabrication method"),
    dropboxUrl: z.string().url("Must be a valid URL").or(z.literal("")),
    isOem: z.boolean(),
})

const formSchema = z.object({
    honeypot: z.string().max(0, "Bot detected"), // Should be completely empty
    parts: z.array(partSchema).min(1).max(10, "Maximum 10 parts per submission")
})

type FormValues = z.infer<typeof formSchema>

// --- Sub-Component: PartForm ---
// Using React Hook Form context indirectly via props passed from standard mapping
const PartFormItem = ({
    index,
    control,
    remove,
    canRemove,
    watch,
    setValue,
    platforms,
    categories
}: {
    index: number;
    control: any;
    remove: (index: number) => void;
    canRemove: boolean;
    watch: any;
    setValue: any;
    platforms: Taxonomy[];
    categories: Taxonomy[];
}) => {
    const [activeTab, setActiveTab] = useState<'platform' | 'tag' | null>(null)
    const [isScraping, setIsScraping] = useState(false)

    // Watch fields for this specific array item
    const partValues = watch(`parts.${index}`)
    const titleValue = partValues?.title || ""
    const urlValue = partValues?.url || ""
    const imageSrcValue = partValues?.imageSrc || ""
    const isOemValue = partValues?.isOem || false
    const selectedPlatforms = partValues?.platform || []
    const selectedCategories = partValues?.typeOfPart || []
    const selectedFabMethods = partValues?.fabricationMethod || []

    const toggleArrayItem = (fieldPath: string, value: string, currentArray: string[], isSingle: boolean = false) => {
        if (currentArray.includes(value)) {
            setValue(fieldPath, isSingle ? [] : currentArray.filter(v => v !== value), { shouldValidate: true })
        } else {
            if (isSingle) {
                setValue(fieldPath, [value], { shouldValidate: true })
                setActiveTab(null) // auto-dismiss the popup
            } else {
                setValue(fieldPath, [...currentArray, value], { shouldValidate: true })
            }
        }
    }

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
                if (!titleValue && metadata.title) setValue(`parts.${index}.title`, metadata.title, { shouldValidate: true });
                if (!imageSrcValue && (metadata.image?.url || metadata.logo?.url)) setValue(`parts.${index}.imageSrc`, metadata.image?.url || metadata.logo?.url, { shouldValidate: true });
                if (!partValues?.externalUrl) setValue(`parts.${index}.externalUrl`, urlValue, { shouldValidate: true });
                if (selectedCategories.length === 0) setValue(`parts.${index}.typeOfPart`, ["Miscellaneous"], { shouldValidate: true });
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
                    <div className="d-flex gap-2 mb-2">
                        <Button variant={activeTab === 'platform' ? 'primary' : 'outline-light'} onClick={() => setActiveTab(activeTab === 'platform' ? null : 'platform')}>Manufacturer (Platform) *</Button>
                        <Button variant={activeTab === 'tag' ? 'primary' : 'outline-light'} onClick={() => setActiveTab(activeTab === 'tag' ? null : 'tag')}>Category *</Button>
                    </div>

                    <div className={`mt-3 p-4 rounded bg-secondary border border-secondary shadow-sm ${!activeTab ? 'd-none' : ''}`}>
                        <div className="d-flex flex-wrap gap-2">
                            {(activeTab === 'platform' ? platforms : categories).map(opt => (
                                <Badge
                                    key={opt.id}
                                    bg={(activeTab === 'platform' ? selectedPlatforms : selectedCategories).includes(opt.name) ? "primary" : "none"}
                                    className="p-2 border border-light cursor-pointer shadow-sm"
                                    onClick={() => toggleArrayItem(`parts.${index}.${activeTab === 'platform' ? 'platform' : 'typeOfPart'}`, opt.name, activeTab === 'platform' ? selectedPlatforms : selectedCategories, true)}
                                >
                                    {opt.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Controller
                        control={control}
                        name={`parts.${index}.platform`}
                        render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                    />
                    <Controller
                        control={control}
                        name={`parts.${index}.typeOfPart`}
                        render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                    />

                    {/* Taxonomy Summary Pills */}
                    <div className="mt-4 p-3 rounded-pill bg-black border border-secondary d-flex align-items-center justify-content-center gap-2 flex-wrap shadow-inner" style={{ minHeight: '52px' }}>
                        {selectedPlatforms.length === 0 && selectedCategories.length === 0 && !isOemValue ? (
                            <span className="small text-muted opacity-50 italic">No tags selected yet...</span>
                        ) : (
                            <>
                                {isOemValue && <Badge bg="none" className="px-3 py-2 border rounded-pill uppercase small" style={{ color: '#a855f7', borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>OEM</Badge>}
                                {selectedPlatforms.map((p: string) => <Badge key={p} bg="primary" className="px-3 py-2 rounded-pill uppercase small">{p}</Badge>)}
                                {selectedCategories.map((t: string) => <Badge key={t} bg="none" className="px-3 py-2 border border-primary text-primary rounded-pill uppercase small" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>{t}</Badge>)}
                            </>
                        )}
                    </div>
                </div>

                {/* 5. Additional / Minor Selectors */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Fab Method *</Form.Label>
                        <div className="d-flex flex-wrap gap-2 p-3 bg-secondary rounded border border-secondary shadow-inner">
                            {FAB_METHODS.map(m => (
                                <Button
                                    key={m}
                                    size="sm"
                                    variant={selectedFabMethods.includes(m) ? "primary" : "outline-light"}
                                    onClick={() => toggleArrayItem(`parts.${index}.fabricationMethod`, m, selectedFabMethods)}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>
                        <Controller
                            control={control}
                            name={`parts.${index}.fabricationMethod`}
                            render={({ fieldState }) => (fieldState.error ? <div className="text-danger small mt-2 fw-bold">{fieldState.error.message}</div> : <></>)}
                        />
                    </Col>
                    <Col md={6}>
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
                                        />
                                        {fieldState.error && <div className="text-danger small mt-1 fw-bold">{fieldState.error.message}</div>}
                                    </>
                                )}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    )
}

// --- Main Component: SubmitPage ---
const SubmitPage: React.FC<PageProps> = () => {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState<string>('')

    const [platforms, setPlatforms] = useState<Taxonomy[]>([])
    const [categories, setCategories] = useState<Taxonomy[]>([])
    const [isTaxonomyLoading, setIsTaxonomyLoading] = useState(true)

    // Setup React Hook Form native integration
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            honeypot: "", // Empty to start
            parts: [{
                id: Math.random().toString(36).substr(2, 9),
                url: "",
                externalUrl: "",
                title: "",
                imageSrc: "",
                platform: [],
                fabricationMethod: ["3d Printed"],
                typeOfPart: [],
                dropboxUrl: "",
                isOem: false
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
                const { data: pData } = await client.from('board_platforms').select('id, name').order('name');
                const { data: cData } = await client.from('part_categories').select('id, name').order('name');
                if (isMounted) {
                    if (pData && pData.length > 0) setPlatforms(pData);
                    else setPlatforms(DEFAULT_PLATFORMS);
                    if (cData && cData.length > 0) setCategories(cData);
                    else setCategories(DEFAULT_CATEGORIES);
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
            // Reset and fake success to misdirect the bot
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

            // Map strictly to PostgREST schema, applying defaults
            const payloads = data.parts.map(p => ({
                title: p.title,
                platform: p.platform,
                type_of_part: p.typeOfPart,
                fabrication_method: p.fabricationMethod,
                external_url: p.externalUrl || p.url,
                image_src: p.imageSrc || null,
                dropbox_url: p.dropboxUrl || null,
                is_oem: p.isOem,
                status: 'pending' // Enforce rule for insertions directly here
            }));

            // Send standard anon DB insert
            const { error: insertError } = await client.from('parts').insert(payloads);

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
                    url: "", externalUrl: "", title: "", imageSrc: "", platform: [],
                    fabricationMethod: ["3d Printed"], typeOfPart: [], dropboxUrl: "", isOem: false
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

    const isSuccessState = status === 'success';
    const isErrorState = status === 'error';

    return (
        <AppErrorBoundary>
            <div className="bg-black text-light min-vh-100 pb-5 mb-5">
                <GlobalStyles />
                <SiteNavbar />
                <Container className="py-5" style={{ maxWidth: '900px' }}>
                    <header className="text-center mb-5">
                        <h1 className="display-4 fw-bold">Submit Parts</h1>
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
                                                        url: "", externalUrl: "", title: "", imageSrc: "", platform: [],
                                                        fabricationMethod: ["3d Printed"], typeOfPart: [], dropboxUrl: "", isOem: false
                                                    })}
                                                    disabled={status === 'submitting'}
                                                >
                                                    + Add Another Part ({fields.length}/10)
                                                </Button>
                                            )}

                                            <div className="p-4 bg-dark rounded border border-secondary shadow-lg">
                                                <div className="d-flex flex-column gap-3">
                                                    <p className="small text-light opacity-50 mb-0">
                                                        By submitting, you confirm you have permission to share these resources.
                                                    </p>
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        type="submit"
                                                        className="px-5 py-3 fw-bold shadow-lg"
                                                        disabled={status === 'submitting'}
                                                    >
                                                        {status === 'submitting' ? <><Spinner animation="border" size="sm" className="me-2" /> Saving to Database...</> : `Submit All ${fields.length} Parts`}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Form>
                        )}
                    </ClientOnly>
                </Container>

                <SiteFooter />

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .bg-secondary { background-color: #121417 !important; } 
                    .border-secondary { border-color: #24282d !important; } 
                    .input-contrast { background-color: #2b3035 !important; border-color: #495057 !important; color: #fff !important; } 
                    .shadow-inner { box-shadow: inset 0 2px 8px rgba(0,0,0,0.7); } 
                    .cursor-pointer { cursor: pointer; } 
                    .uppercase { text-transform: uppercase; }
                    .letter-spacing-1 { letter-spacing: 0.1rem; }
                    .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                    .part-form-card { overflow: visible !important; }
                ` }} />
            </div>
        </AppErrorBoundary>
    )
}

export default SubmitPage
