import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Form, Spinner, InputGroup, Badge } from 'react-bootstrap';
import { useBrandHardware } from '../../hooks/useBrandHardware';
import { Model } from '../../lib/supabase';

interface HardwareFieldsProps {
    brandId: string | null;
    modelId: string | null; // Can be a UUID or a custom string if new
    needsModelReview: boolean;
    onChangeModel: (modelId: string | null) => void;
    onChangeNeedsReview: (needsReview: boolean) => void;
}

export default function HardwareFields({
    brandId,
    modelId,
    needsModelReview,
    onChangeModel,
    onChangeNeedsReview
}: HardwareFieldsProps) {
    const { models, isLoading } = useBrandHardware(brandId);

    // UI states
    const [isOpen, setIsOpen] = useState(!!modelId);
    const prevOpen = useRef(isOpen);

    // For Board Model
    const [isAddingNewModel, setIsAddingNewModel] = useState(false);
    const [tempCustomModel, setTempCustomModel] = useState("");

    // Sync init state
    useEffect(() => {
        if (modelId) {
            setIsOpen(true);
        }
    }, [modelId]);

    // Reset when toggled off - ONLY if it was previously open
    useEffect(() => {
        if (prevOpen.current === true && isOpen === false) {
            onChangeModel(null);
            onChangeNeedsReview(false);
            setIsAddingNewModel(false);
        }
        prevOpen.current = isOpen;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Find if the current modelId corresponds to an existing model name for display
    const selectedModelName = useMemo(() => {
        if (!modelId) return null;
        const found = models.find(m => m.id === modelId);
        return found ? found.name : modelId; // Fallback to modelId string if it's a new custom name
    }, [models, modelId]);

    if (!brandId) return null; // wait until brand selected

    const handleModelSelect = (m: Model) => {
        onChangeModel(modelId === m.id ? null : m.id);
        onChangeNeedsReview(false);
        setIsAddingNewModel(false);
    };

    const confirmCustomModel = () => {
        const trimmed = tempCustomModel.trim();
        if (trimmed) {
            const existingModel = models.find(m => m.name.toLowerCase() === trimmed.toLowerCase());
            if (existingModel) {
                onChangeModel(existingModel.id);
                onChangeNeedsReview(false);
            } else {
                onChangeModel(trimmed); // Store the name temporarily; onSubmit will handle insertion
                onChangeNeedsReview(true);
            }
        }
        setIsAddingNewModel(false);
    };

    const cancelCustomModel = () => {
        setTempCustomModel("");
        setIsAddingNewModel(false);
    };

    return (
        <div className="mt-4">
            {!isOpen ? (
                <Button
                    variant="outline-secondary"
                    className="w-100 p-3 text-uppercase fw-bold small opacity-75 border-secondary"
                    onClick={() => setIsOpen(true)}
                >
                    Link to specific hardware model?
                </Button>
            ) : (
                <div className="bg-black bg-opacity-25 rounded border border-secondary p-4 shadow-sm animate-in fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-info" style={{ width: '3px', height: '15px' }}></div>
                            <h6 className="small fw-bold text-uppercase text-light mb-0" style={{ letterSpacing: '0.1em' }}>Fitment Matrix</h6>
                        </div>
                        <Button
                            variant="link"
                            className="p-0 text-uppercase fw-bold text-danger small text-decoration-none opacity-50 hover-opacity-100"
                            onClick={() => setIsOpen(false)}
                        >
                            Deactivate Segment
                        </Button>
                    </div>

                    <div>
                        {/* MODEL SELECTION */}
                        <div className="mb-3">
                            <h6 className="small fw-bold text-uppercase text-light opacity-50 mb-3" style={{ letterSpacing: '0.1em' }}>Hardware Segments</h6>
                            {isLoading ? (
                                <div className="d-flex gap-2 align-items-center">
                                    <Spinner animation="border" size="sm" variant="info" />
                                    <span className="small text-light opacity-50 text-uppercase">Detecting Hardware...</span>
                                </div>
                            ) : (
                                <div className="d-flex flex-wrap gap-2">
                                    {!isAddingNewModel && models.map(m => {
                                        const isSelected = modelId === m.id;
                                        return (
                                            <Button
                                                key={m.id}
                                                variant={isSelected ? "info" : "outline-light"}
                                                size="sm"
                                                className={`px-3 py-2 text-uppercase fw-bold small ${isSelected ? 'text-black' : 'text-light opacity-75 border-secondary'}`}
                                                onClick={() => handleModelSelect(m)}
                                            >
                                                {m.name}
                                            </Button>
                                        );
                                    })}

                                    {!isAddingNewModel && modelId && !models.some(m => m.id === modelId) && (
                                        <Badge bg="warning" text="dark" className="d-flex align-items-center gap-2 px-3 py-2 text-uppercase fw-bold small cursor-pointer" onClick={() => onChangeModel(null)}>
                                            🚩 {modelId}
                                        </Badge>
                                    )}

                                    {!isAddingNewModel && (
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            className="px-3 py-2 text-uppercase fw-bold small ms-auto border-secondary opacity-75 text-light"
                                            onClick={() => {
                                                setIsAddingNewModel(true);
                                                setTempCustomModel("");
                                            }}
                                        >
                                            Override / New
                                        </Button>
                                    )}

                                    {isAddingNewModel && (
                                        <div className="w-100 mt-2">
                                            <InputGroup className="shadow-sm border border-secondary rounded overflow-hidden">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Input model designation..."
                                                    value={tempCustomModel}
                                                    onChange={e => setTempCustomModel(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') confirmCustomModel();
                                                        if (e.key === 'Escape') cancelCustomModel();
                                                    }}
                                                    className="bg-black text-white border-0 p-3 small fw-bold"
                                                    autoFocus
                                                />
                                                <Button variant="success" className="fw-bold px-4 border-0" onClick={confirmCustomModel}>
                                                    Confirm
                                                </Button>
                                                <Button variant="secondary" className="fw-bold px-4 border-0" onClick={cancelCustomModel}>
                                                    Back
                                                </Button>
                                            </InputGroup>
                                            <div className="small fw-bold text-warning text-uppercase mt-3 opacity-100" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                                                🚩 This item will be flagged for administrative sequence verification.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
