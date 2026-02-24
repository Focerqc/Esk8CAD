import React, { useState } from "react";
import { Badge, Card, Col } from "react-bootstrap";
import { Link } from "gatsby";

export interface PartSchema {
    id: string;
    title: string;
    image_url: string;
    author: string;
    boardPlatform: string;
    tags: string[];
    externalUrl?: string;
    dropboxUrl?: string;
}

export const PartCard = ({ part, index }: { part: PartSchema; index?: number }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <Col
            xs={12} sm={6} md={6} lg={4} xl={3}
            className="mb-4 d-flex align-items-stretch"
            style={{ minWidth: '280px', flexShrink: 0 }}
            key={`part-card-${part.id}-${index}`}
        >
            <div className="w-100 h-100 position-relative z-index-0">
                <Card className="h-100 shadow-sm border-secondary db-card bg-dark text-light">
                    {/* Image Area with 16:9 Aspect Ratio */}
                    <div className="card-img-holder position-relative overflow-hidden"
                        style={{ aspectRatio: "16 / 9", height: "auto", width: "100%", backgroundColor: "#1a1d20" }}>
                        {!imgError && part.image_url ? (
                            <img
                                src={part.image_url}
                                alt={`Preview of ${part.title}`}
                                className="w-100 h-100"
                                style={{
                                    objectFit: 'cover',
                                    borderTopLeftRadius: 'var(--bs-card-inner-border-radius)',
                                    borderTopRightRadius: 'var(--bs-card-inner-border-radius)'
                                }}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted placeholder-glow text-center p-3" style={{ borderTopLeftRadius: 'var(--bs-card-inner-border-radius)', borderTopRightRadius: 'var(--bs-card-inner-border-radius)' }}>
                                <div className="placeholder w-100 h-100 bg-secondary" style={{ opacity: 0.2 }}></div>
                                <span className="position-absolute z-index-1">No Image Available</span>
                            </div>
                        )}

                        {/* ID Badge overlaid TOP RIGHT */}
                        <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                            <Link to={`/id/${part.id}`}>
                                <Badge bg="primary" className="shadow-sm py-2 px-3 border border-dark">
                                    #{part.id.substring(0, 5)}
                                </Badge>
                            </Link>
                        </div>
                    </div>

                    <Card.Body className="d-flex flex-column">
                        <Card.Title as="h5" className="mb-1 fw-bold text-white text-truncate" title={part.title}>
                            {part.title}
                        </Card.Title>
                        <Card.Subtitle className="mb-3 text-muted small">
                            By: <span className="text-light">{part.author || "Unknown"}</span>
                        </Card.Subtitle>

                        <div className="mb-3">
                            <span className="text-info fw-bold small me-2 d-block mb-2 text-uppercase letter-spacing-1">{part.boardPlatform}</span>
                            <div className="d-flex flex-wrap gap-1">
                                {part.tags.map((tag, i) => (
                                    <Badge key={i} pill bg="secondary" className="border border-secondary py-1 px-2 text-truncate" style={{ maxWidth: '150px' }}>
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Always anchor at bottom */}
                        <div className="mt-auto pt-3 border-top border-secondary">
                            {part.externalUrl ? (
                                <Card.Link href={part.externalUrl} target="_blank" className="btn btn-outline-info btn-sm w-100 fw-bold m-0 position-relative z-index-1 mb-2">
                                    External Listing
                                </Card.Link>
                            ) : (
                                <button className="btn btn-outline-secondary btn-sm w-100 fw-bold m-0 disabled border-0 mb-2" aria-disabled="true">
                                    No External Link
                                </button>
                            )}
                            {part.dropboxUrl && (
                                <Card.Link href={part.dropboxUrl} target="_blank" className="btn btn-outline-success btn-sm w-100 fw-bold m-0 position-relative z-index-1">
                                    Mirror
                                </Card.Link>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Col>
    );
};

export default PartCard;
