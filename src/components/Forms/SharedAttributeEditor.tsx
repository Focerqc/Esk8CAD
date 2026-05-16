import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, InputGroup } from 'react-bootstrap';

interface SharedAttributeEditorProps {
    attributes: Record<string, any>;
    onChange: (attributes: Record<string, any>) => void;
    templateFields?: { key: string }[];
    onUnsavedChange?: (hasUnsaved: boolean) => void;
    suggestions?: string[];
}

const SharedAttributeEditor: React.FC<SharedAttributeEditorProps> = ({
    attributes,
    onChange,
    templateFields = [],
    onUnsavedChange,
    suggestions = []
}) => {
    const [newCustomKey, setNewCustomKey] = useState("");
    const [newCustomType, setNewCustomType] = useState<'text' | 'dimension'>("dimension");
    const [newCustomUnit, setNewCustomUnit] = useState("mm");
    const [newCustomValue, setNewCustomValue] = useState("");
    
    // Bearing Mode States
    const [isBearingMode, setIsBearingMode] = useState(false);
    const [bID, setBID] = useState("");
    const [bOD, setBOD] = useState("");
    const [bW, setBW] = useState("");

    useEffect(() => {
        if (onUnsavedChange) {
            const hasUnsavedAttr = !!(newCustomKey.trim() || (isBearingMode ? (bID.trim() || bOD.trim() || bW.trim()) : newCustomValue.trim()));
            onUnsavedChange(hasUnsavedAttr);
        }
    }, [newCustomKey, newCustomValue, isBearingMode, bID, bOD, bW, onUnsavedChange]);

    const templateKeys = templateFields.map(tf => tf.key);
    const customKeys = Object.keys(attributes || {}).filter(k => !templateKeys.includes(k) && !k.endsWith('__unit'));

    const handleAdd = () => {
        const k = newCustomKey.trim();
        const unit = newCustomUnit.trim();
        let v = newCustomValue.trim();

        if (isBearingMode) {
            v = `${bID.trim() || '0'}x${bOD.trim() || '0'}x${bW.trim() || '0'}`;
        }

        if (k && v && unit) {
            const newAttrs = { ...attributes, [k]: v };
            newAttrs[`${k}__unit`] = unit;
            
            onChange(newAttrs);
            setNewCustomKey("");
            setNewCustomValue("");
            setBID("");
            setBOD("");
            setBW("");
            setIsBearingMode(false);
        }
    };

    return (
        <div className="d-flex flex-column gap-2 mb-2">
            {customKeys.map(k => {
                const unit = attributes[`${k}__unit`] || "";
                const isDim = ['mm', 'cm', 'in'].includes(unit) || unit.toLowerCase().includes('bearing');
                return (
                    <div key={k} className="bg-secondary bg-opacity-10 p-2 rounded d-flex justify-content-between align-items-center border border-secondary border-opacity-25 shadow-sm mb-1">
                        <div className="d-flex align-items-center gap-3">
                            <Badge bg={isDim ? "info" : "secondary"} className={`${isDim ? 'text-dark' : 'text-light'} extreme-small px-2 py-1`}>
                                {isDim ? 'DIMENSION' : 'OTHER UNITS'}
                            </Badge>
                            <span className="text-white small fw-bold">{k}:</span>
                            <span className="text-info small">{attributes[k]} {unit && <span className="text-muted ms-1 italic" style={{ fontSize: '0.7rem' }}>{unit}</span>}</span>
                        </div>
                        <Button variant="link" className="text-danger p-0 px-2 text-decoration-none fw-bold hover-opacity-100 opacity-50" onClick={() => {
                            const newAttrs = { ...attributes };
                            delete newAttrs[k];
                            delete newAttrs[`${k}__unit`];
                            onChange(newAttrs);
                        }}>×</Button>
                    </div>
                );
            })}

            <div className="p-3 bg-black bg-opacity-25 rounded border border-secondary border-opacity-25 mt-2 shadow-sm">
                <h6 className="text-info extreme-small fw-bold text-uppercase mb-3 italic">Add Custom Specification</h6>
                <Row className="g-2">
                    <Col md={3}>
                        <Form.Control 
                            placeholder="Key* (e.g. Weight)" 
                            className={`bg-dark text-white p-2 small ${!newCustomKey && 'border-warning border-opacity-25'}`}
                            value={newCustomKey}
                            onChange={e => setNewCustomKey(e.target.value)}
                            list="attribute-suggestions"
                            style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8f9fa' }}
                        />
                        <datalist id="attribute-suggestions">
                            {suggestions.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </Col>
                    <Col md={2}>
                        <Form.Select 
                            className="bg-dark text-white border-secondary p-2 small"
                            value={newCustomType}
                            onChange={e => {
                                const val = e.target.value as 'text' | 'dimension';
                                setNewCustomType(val);
                                if (val === 'text') {
                                    setNewCustomUnit("");
                                    setIsBearingMode(false);
                                } else {
                                    setNewCustomUnit("mm");
                                }
                            }}
                            style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8f9fa' }}
                        >
                            <option value="dimension">Dimension</option>
                            <option value="text">Other Units</option>
                        </Form.Select>
                    </Col>
                    <Col md={2} className="position-relative">
                        {/* Primary Quick-links Above */}
                        <div className="d-flex gap-1 position-absolute" style={{ top: '-18px', left: '8px', zIndex: 10 }}>
                            <Badge bg={newCustomUnit === 'mm' ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => { setNewCustomUnit("mm"); setNewCustomType('dimension'); }}>mm</Badge>
                            <Badge bg={newCustomUnit === 'cm' ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => { setNewCustomUnit("cm"); setNewCustomType('dimension'); }}>cm</Badge>
                            <Badge bg={newCustomUnit === 'in' ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => { setNewCustomUnit("in"); setNewCustomType('dimension'); }}>in</Badge>
                        </div>
                        
                        <Form.Control 
                            placeholder="Unit*" 
                            className={`bg-dark text-white p-2 small text-center ${!newCustomUnit && 'border-warning border-opacity-50'}`}
                            value={newCustomUnit}
                            onChange={e => setNewCustomUnit(e.target.value)}
                            style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8f9fa' }}
                        />

                        {/* Secondary Quick-links Below */}
                        <div className="d-flex flex-wrap gap-1 position-absolute" style={{ bottom: '-18px', left: '8px', zIndex: 10, width: 'max-content' }}>
                            <Badge bg={isBearingMode ? "primary" : "secondary"} className="cursor-pointer extreme-small opacity-75 hover-opacity-100" onClick={() => {
                                setIsBearingMode(!isBearingMode);
                                if (!isBearingMode) {
                                    if (!newCustomKey) setNewCustomKey("Bearing Size");
                                    // Keep current unit if it's mm/in, otherwise default to mm
                                    if (newCustomUnit !== 'in') setNewCustomUnit("mm");
                                    setNewCustomType('dimension');
                                }
                            }}>Bearing</Badge>
                            {['kg', 'lb', 'V', 'Wh', 'kv', 'T'].map(u => (
                                <Badge key={u} bg={newCustomUnit === u ? "info" : "secondary"} className="cursor-pointer extreme-small opacity-50 hover-opacity-100" onClick={() => {
                                    setNewCustomUnit(u);
                                    setNewCustomType('text');
                                    setIsBearingMode(false);
                                }}>{u}</Badge>
                            ))}
                        </div>
                    </Col>
                    <Col md={4}>
                        {isBearingMode ? (
                            <div className="d-flex align-items-center gap-1">
                                <Form.Control placeholder="ID" className="bg-dark text-white border-secondary p-2 small text-center flex-grow-1" value={bID} onChange={e => setBID(e.target.value)} />
                                <span className="text-secondary small">×</span>
                                <Form.Control placeholder="OD" className="bg-dark text-white border-secondary p-2 small text-center flex-grow-1" value={bOD} onChange={e => setBOD(e.target.value)} />
                                <span className="text-secondary small">×</span>
                                <Form.Control placeholder="W" className="bg-dark text-white border-secondary p-2 small text-center flex-grow-1" value={bW} onChange={e => setBW(e.target.value)} />
                            </div>
                        ) : (
                            <InputGroup size="sm">
                                <Form.Control 
                                    type={newCustomType === 'dimension' ? "number" : "text"}
                                    step="any"
                                    placeholder="Value*..." 
                                    className={`bg-dark text-white p-2 small text-end ${!newCustomValue && 'border-warning border-opacity-25'}`}
                                    value={newCustomValue}
                                    onChange={e => setNewCustomValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    style={{ 
                                        backgroundColor: '#0f172a',
                                        borderColor: '#334155',
                                        color: '#f8f9fa',
                                        ...((newCustomType === 'dimension' || newCustomUnit) ? { borderRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {})
                                    }}
                                />
                                {(newCustomType === 'dimension' || (newCustomUnit && !isBearingMode)) && (
                                    <InputGroup.Text className="bg-transparent border-secondary border-start-0 text-info opacity-75 extreme-small fw-bold">
                                        {newCustomUnit || (newCustomType === 'dimension' ? 'mm' : '')}
                                    </InputGroup.Text>
                                )}
                            </InputGroup>
                        )}
                    </Col>
                    <Col md={1}>
                        <Button 
                            variant="info" 
                            className="w-100 h-100 fw-bold small shadow-sm"
                            disabled={!newCustomKey.trim() || !newCustomUnit.trim() || (isBearingMode ? !(bID.trim() || bOD.trim() || bW.trim()) : !newCustomValue.trim())}
                            onClick={handleAdd}
                        >ADD</Button>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default SharedAttributeEditor;
