import React, { useState, useEffect, useMemo } from 'react';
import { Button, Form, Spinner, InputGroup } from 'react-bootstrap';
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
    const [isOpen, setIsOpen] = useState(false);

    // For Board Model
    const [isAddingNewModel, setIsAddingNewModel] = useState(false);
    const [tempCustomModel, setTempCustomModel] = useState("");

    // Sync init state
    useEffect(() => {
        if (modelId) {
            setIsOpen(true);
        }
    }, [modelId]);

    // Reset when toggled off
    useEffect(() => {
        if (!isOpen && modelId !== null) {
            onChangeModel(null);
            onChangeNeedsReview(false);
            setIsAddingNewModel(false);
        }
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
        <div className="mt-4 p-4 bg-dark border border-secondary rounded shadow-sm">
            {!isOpen ? (
                <Button
                    variant="outline-info"
                    className="w-100 fw-bold py-3"
                    onClick={() => setIsOpen(true)}
                >
                    Does this part fit a specific board model?
                </Button>
            ) : (
                <div className="hardware-drilldown">
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                        <h5 className="text-info fw-bold mb-0">Hardware Fitment Context</h5>
                        <Button variant="outline-secondary" size="sm" onClick={() => setIsOpen(false)}>Cancel / Clear</Button>
                    </div>

                    <div className="d-flex flex-column gap-4">
                        {/* MODEL SELECTION */}
                        <div>
                            <h6 className="small uppercase text-light opacity-75 fw-bold mb-2">Exact Board Model</h6>
                            {isLoading ? <Spinner size="sm" animation="border" variant="info" /> : (
                                <div className="d-flex flex-wrap gap-2 p-3 bg-black rounded border border-secondary shadow-inner">

                                    {!isAddingNewModel && models.map(m => {
                                        const isSelected = modelId === m.id;
                                        return (
                                            <Button
                                                key={m.id}
                                                size="sm"
                                                variant={isSelected ? "primary" : "outline-light"}
                                                onClick={() => handleModelSelect(m)}
                                            >
                                                {m.name}
                                            </Button>
                                        );
                                    })}

                                    {/* Show the custom model button if it's currently selected but not in the DB list */}
                                    {!isAddingNewModel && modelId && !models.some(m => m.id === modelId) && (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => onChangeModel(null)}
                                        >
                                            <span className="me-1">🚩</span>
                                            {modelId}
                                        </Button>
                                    )}

                                    {!isAddingNewModel && (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            className={`fw-bold ${models.length > 0 ? "ms-auto" : ""}`}
                                            onClick={() => {
                                                setIsAddingNewModel(true);
                                                setTempCustomModel("");
                                            }}
                                        >
                                            Other / Add New
                                        </Button>
                                    )}

                                    {isAddingNewModel && (
                                        <div className="w-100 position-relative">
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Type new board model..."
                                                    value={tempCustomModel}
                                                    onChange={e => setTempCustomModel(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') confirmCustomModel();
                                                        if (e.key === 'Escape') cancelCustomModel();
                                                    }}
                                                    className="bg-dark text-white border-warning placeholder-white"
                                                    autoFocus
                                                />
                                                <Button variant="success" className="fw-bold px-3" onClick={confirmCustomModel}>
                                                    ✓ Confirm
                                                </Button>
                                                <Button variant="outline-warning" onClick={cancelCustomModel}>
                                                    Cancel
                                                </Button>
                                            </InputGroup>
                                            <small className="text-warning mt-2 d-block fw-bold">
                                                🚩 This will flag the model name for admin sequence alignment.
                                            </small>
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
