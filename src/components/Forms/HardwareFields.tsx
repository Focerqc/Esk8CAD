import React, { useState, useEffect, useMemo } from 'react';
import { Button, Form, Spinner, InputGroup } from 'react-bootstrap';
import { useBrandHardware } from '../../hooks/useBrandHardware';

interface HardwareFieldsProps {
    platform: string[];
    boardModel: string | null;
    releaseYear: number | null;
    needsModelReview: boolean;
    onChangeModel: (model: string | null) => void;
    onChangeYear: (year: number | null) => void;
    onChangeNeedsReview: (needsReview: boolean) => void;
}

export default function HardwareFields({
    platform,
    boardModel,
    releaseYear,
    needsModelReview,
    onChangeModel,
    onChangeYear,
    onChangeNeedsReview
}: HardwareFieldsProps) {
    const { models, years, isLoading } = useBrandHardware(platform);

    // UI states
    const [isOpen, setIsOpen] = useState(false);

    // For Board Model
    const [isAddingNewModel, setIsAddingNewModel] = useState(false);
    const [tempCustomModel, setTempCustomModel] = useState("");

    // Sync init state
    useEffect(() => {
        if (boardModel || releaseYear) {
            setIsOpen(true);
        }
    }, [boardModel, releaseYear]);

    const activePlatform = platform.length > 0 ? platform[0] : null;
    const isGeneric = activePlatform ? ["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Miscellaneous"].includes(activePlatform) : false;

    // Reset when toggled off
    useEffect(() => {
        if (!isOpen && (boardModel !== null || releaseYear !== null)) {
            onChangeModel(null);
            onChangeYear(null);
            onChangeNeedsReview(false);
            setIsAddingNewModel(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!activePlatform) return null; // wait until platform selected

    const handleModelSelect = (m: string) => {
        onChangeModel(boardModel === m ? null : m);
        // If they click an existing button from the models list, it doesn't need review
        // unless it's a custom model that was already flagged
        const isExistingModelFromDb = models.includes(m);
        onChangeNeedsReview(!isExistingModelFromDb);
        setIsAddingNewModel(false);
    };

    const handleYearSelect = (y: number) => {
        onChangeYear(releaseYear === y ? null : y);
    }

    const confirmCustomModel = () => {
        const trimmed = tempCustomModel.trim();
        if (trimmed) {
            const existingModel = models.find(m => m.toLowerCase() === trimmed.toLowerCase());
            if (existingModel) {
                onChangeModel(existingModel);
                onChangeNeedsReview(false);
            } else {
                onChangeModel(trimmed);
                onChangeNeedsReview(true);
            }
        }
        setIsAddingNewModel(false);
    };

    const cancelCustomModel = () => {
        setTempCustomModel("");
        setIsAddingNewModel(false);
    };

    // Combine fetched years and current releaseYear (if custom)
    const displayYears = useMemo(() => {
        const allYears = new Set(years);
        if (releaseYear) allYears.add(releaseYear);
        return Array.from(allYears).sort((a, b) => b - a); // descending
    }, [years, releaseYear]);

    // Combine fetched models and current boardModel (if custom)
    const displayModels = useMemo(() => {
        const allModels = new Set(models);
        if (boardModel) allModels.add(boardModel);
        return Array.from(allModels).sort((a, b) => a.localeCompare(b));
    }, [models, boardModel]);

    return (
        <div className="mt-4 p-4 bg-dark border border-secondary rounded shadow-sm">
            {!isOpen ? (
                <Button
                    variant="outline-info"
                    className="w-100 fw-bold py-3"
                    onClick={() => setIsOpen(true)}
                    disabled={isGeneric && !activePlatform}
                >
                    Does this part fit a specific make/model of {activePlatform || 'a brand'}?
                </Button>
            ) : (
                <div className="hardware-drilldown">
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                        <h5 className="text-info fw-bold mb-0">Hardware Fitment Context</h5>
                        <Button variant="outline-secondary" size="sm" onClick={() => setIsOpen(false)}>Cancel / Clear</Button>
                    </div>

                    {isGeneric ? (
                        <div className="text-center p-3 text-muted">
                            <p className="mb-0">Please select a specific Manufacturer (Platform) above to associate a model.</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
                            {/* YEAR SELECTION */}
                            <div>
                                <h6 className="small uppercase text-light opacity-75 fw-bold mb-2">1. Release Year (Optional)</h6>
                                {isLoading ? <Spinner size="sm" animation="border" variant="info" /> : (
                                    <div className="d-flex flex-wrap gap-2 p-3 bg-black rounded border border-secondary shadow-inner">
                                        {displayYears.map(y => (
                                            <Button
                                                key={y}
                                                size="sm"
                                                variant={releaseYear === y ? "info" : "outline-light"}
                                                onClick={() => handleYearSelect(y)}
                                            >
                                                {y}
                                            </Button>
                                        ))}

                                        <Button
                                            size="sm"
                                            variant={displayYears.length > 0 ? "outline-secondary" : "outline-info"}
                                            className={displayYears.length > 0 ? "ms-auto" : ""}
                                            onClick={() => {
                                                const promptYear = window.prompt("Enter 4-digit year:");
                                                if (promptYear && !isNaN(Number(promptYear)) && promptYear.length === 4) {
                                                    onChangeYear(Number(promptYear));
                                                }
                                            }}
                                        >
                                            + Add Year
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* MODEL SELECTION */}
                            <div>
                                <h6 className="small uppercase text-light opacity-75 fw-bold mb-2">2. Exact Board Model</h6>
                                {isLoading ? <Spinner size="sm" animation="border" variant="info" /> : (
                                    <div className="d-flex flex-wrap gap-2 p-3 bg-black rounded border border-secondary shadow-inner">

                                        {!isAddingNewModel && displayModels.map(m => {
                                            const isSelected = boardModel === m;
                                            const isCustomSelected = isSelected && needsModelReview;
                                            return (
                                                <Button
                                                    key={m}
                                                    size="sm"
                                                    variant={isSelected ? (isCustomSelected ? "warning" : "primary") : "outline-light"}
                                                    onClick={() => handleModelSelect(m)}
                                                >
                                                    {isCustomSelected && <span className="me-1">🚩</span>}
                                                    {m}
                                                </Button>
                                            );
                                        })}

                                        {!isAddingNewModel && (
                                            <Button
                                                size="sm"
                                                variant="warning"
                                                className={`fw-bold ${displayModels.length > 0 ? "ms-auto" : ""}`}
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
                    )}
                </div>
            )}
        </div>
    );
}
