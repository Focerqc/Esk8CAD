import React, { useState, useEffect } from 'react';
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
    const [isCustomModel, setIsCustomModel] = useState(needsModelReview || false);
    const [customModelText, setCustomModelText] = useState(needsModelReview ? (boardModel || "") : "");

    // Sync init state
    useEffect(() => {
        if (boardModel || releaseYear) {
            setIsOpen(true);
            if (needsModelReview) setIsCustomModel(true);
        }
    }, [boardModel, releaseYear, needsModelReview]);

    const activePlatform = platform.length > 0 ? platform[0] : null;
    const isGeneric = activePlatform ? ["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Miscellaneous"].includes(activePlatform) : false;

    // Reset when toggled off
    useEffect(() => {
        if (!isOpen && (boardModel !== null || releaseYear !== null)) {
            onChangeModel(null);
            onChangeYear(null);
            onChangeNeedsReview(false);
            setIsCustomModel(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isCustomModel) {
            onChangeModel(customModelText);
            onChangeNeedsReview(true);
        }
    }, [customModelText, isCustomModel]);

    if (!activePlatform) return null; // wait until platform selected

    const handleModelSelect = (m: string) => {
        onChangeModel(boardModel === m ? null : m);
        onChangeNeedsReview(false);
        setIsCustomModel(false);
    };

    const handleYearSelect = (y: number) => {
        onChangeYear(releaseYear === y ? null : y);
    }

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
                                        {years.length > 0 ? years.map(y => (
                                            <Button
                                                key={y}
                                                size="sm"
                                                variant={releaseYear === y ? "info" : "outline-light"}
                                                onClick={() => handleYearSelect(y)}
                                            >
                                                {y}
                                            </Button>
                                        )) : <span className="text-muted small">No years recorded yet for this brand.</span>}
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="ms-auto"
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
                                        {!isCustomModel && models.map(m => (
                                            <Button
                                                key={m}
                                                size="sm"
                                                variant={boardModel === m ? "primary" : "outline-light"}
                                                onClick={() => handleModelSelect(m)}
                                            >
                                                {m}
                                            </Button>
                                        ))}

                                        {!isCustomModel && (
                                            <Button
                                                size="sm"
                                                variant="warning"
                                                className="fw-bold"
                                                onClick={() => {
                                                    setIsCustomModel(true);
                                                    setCustomModelText("");
                                                    onChangeModel("");
                                                }}
                                            >
                                                Other / Add New
                                            </Button>
                                        )}

                                        {isCustomModel && (
                                            <div className="w-100 position-relative">
                                                <InputGroup>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Type new board model..."
                                                        value={customModelText}
                                                        onChange={e => setCustomModelText(e.target.value)}
                                                        className="bg-dark text-white border-warning placeholder-white"
                                                        autoFocus
                                                    />
                                                    <Button variant="outline-warning" onClick={() => {
                                                        setIsCustomModel(false);
                                                        onChangeModel(null);
                                                        onChangeNeedsReview(false);
                                                    }}>Cancel</Button>
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
