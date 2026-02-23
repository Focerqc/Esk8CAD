import React, { useState } from "react"
import { Badge, Card, Col, Stack } from "react-bootstrap"
import windowIsDefined from "../hooks/windowIsDefined"
import CopyLinkBadge from "./CopyLinkBadge"
import Lightbox from "./Lightbox"

/**
 * Internal component for the image and lightbox to handle state correctly 
 * without violating the Rules of Hooks when ItemCard is mapped.
 */
const ItemImage = ({ item }: { item: ItemData }) => {
    const [lightboxToggler, setLightboxToggler] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)

    // Securely pull nested single images or external URL string
    const imgSrc = Array.isArray(item.imageSrc) ? item.imageSrc[0] : item.imageSrc;

    if (!imgSrc) return (
        <div className="card-img-holder placeholder-glow d-flex align-items-center justify-content-center bg-dark" style={{ height: "220px", width: "100%", aspectRatio: "16 / 9" }}>
            <span className="small text-muted opacity-50">No Image provided</span>
        </div>
    );

    return (
        <>
            {/* Fixed aspect ratio/height wrapper to prevent grid layout shifts */}
            <div
                className={`card-img-holder position-relative overflow-hidden ${!imgLoaded ? 'placeholder-glow' : ''}`}
                style={{ aspectRatio: "16 / 9", height: "auto", width: "100%", cursor: "pointer", backgroundColor: "#1a1d20" }}
                onClick={() => setLightboxToggler(!lightboxToggler)}
            >
                {/* Skeleton loader fallback background */}
                {!imgLoaded && (
                    <div className="position-absolute w-100 h-100 placeholder bg-secondary" style={{ top: 0, left: 0 }} />
                )}

                <img
                    src={imgSrc}
                    alt={"Preview image of part, " + item.title}
                    loading="lazy"
                    className="w-100 h-100"
                    style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        opacity: imgLoaded ? 1 : 0,
                        transition: 'opacity 0.2s ease-in-out',
                        borderTopLeftRadius: 'var(--bs-card-inner-border-radius)',
                        borderTopRightRadius: 'var(--bs-card-inner-border-radius)'
                    }}
                    onLoad={() => setImgLoaded(true)}
                />
            </div>

            {/* Part image lightbox */}
            <Lightbox
                src={[imgSrc].flat()}
                toggler={lightboxToggler}
            />
        </>
    )
}

/**
 * Technical ID Badge Component
 */
const PartIdBadge = ({ item }: { item: any }) => {
    // Determine new string DB schema UUIDs if present
    if (item.id && typeof item.id === 'string') {
        return (
            <Badge bg="primary" className="ms-2 shadow-sm" style={{ fontSize: '0.7rem', padding: '0.3em 0.6em' }}>
                #{item.id.substring(0, 5)}
            </Badge>
        );
    }

    // Legacy support for JSON scraping ID mapping fallback
    const path = item.parent?.relativePath || item._filename;
    if (!path) return null;
    const match = path.match(/part-(\d{4})\.json/);
    if (!match) return null;

    return (
        <Badge bg="primary" className="ms-2 shadow-sm" style={{ fontSize: '0.7rem', padding: '0.3em 0.6em' }}>
            #{match[1]}
        </Badge>
    );
};

/**
 * The inner Card content without the surrounding Col.
 * Useful for when we need to wrap the card in custom admin controls.
 */
export const ItemCardBody = ({ item, index }: { item: ItemData, index: number }) => {
    // Safely structure arrays for direct string printing and Badge colors based on rules
    const hasType = item.typeOfPart && item.typeOfPart.length > 0;
    const hasFab = item.fabricationMethod && item.fabricationMethod.length > 0;

    return (
        <Card className="h-100 shadow-sm border-secondary db-card">
            {/* Part image & Lightbox with enforced height shift corrections */}
            <ItemImage item={item} />

            {/* Part array DB mapping fix. Using join() to render correctly over React elements */}
            <Stack className="display-over-top-right position-absolute" style={{ top: '10px', right: '10px' }} direction="vertical" gap={1}>
                {hasType && (
                    <Badge pill bg="dark" className="border border-secondary shadow-sm py-2 px-3 text-truncate" style={{ maxWidth: '160px' }}>
                        {item.typeOfPart.join(', ')}
                    </Badge>
                )}

                {hasFab && (
                    <Badge pill bg="secondary" className="border border-secondary shadow-sm py-2 px-3 text-truncate" style={{ maxWidth: '160px' }}>
                        {item.fabricationMethod.join(', ')}
                    </Badge>
                )}
            </Stack>

            {/* Copy Link to this item button */}
            <Stack className="display-over-top-left position-absolute" style={{ top: '10px', left: '10px' }} direction="vertical" gap={1}>
                <CopyLinkBadge link={!windowIsDefined() ? "#" : "http://" + window.location.host + window.location.pathname + `?search=${encodeURIComponent(item.title)}`} />
            </Stack>

            {/* Part information */}
            <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <Card.Title as="h5" className="mb-0 fw-bold">{item.title}</Card.Title>
                    <PartIdBadge item={item} />
                </div>

                <div className="mt-auto">
                    {(item.externalUrl || item.dropboxUrl) &&
                        <Stack direction="vertical" gap={2} className="pt-3 border-top border-secondary">
                            {item.externalUrl &&
                                <Card.Link href={item.externalUrl} target="_blank" className="btn btn-outline-info btn-sm w-100 fw-bold m-0 position-relative z-index-1">External Listing</Card.Link>
                            }

                            {item.dropboxUrl &&
                                <Card.Link href={item.dropboxUrl} target="_blank" className="btn btn-outline-primary btn-sm w-100 fw-bold m-0 position-relative z-index-1 text-truncate">
                                    ZIP Download{!!item.dropboxZipLastUpdated && ` (${item.dropboxZipLastUpdated})`}
                                </Card.Link>
                            }
                        </Stack>
                    }
                </div>
            </Card.Body>
        </Card>
    );
};

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/cards | React-Bootstrap Card}
 * with item information from an {@link ItemData}
 * object array. 
 * 
 * NOTE: This is frequently used as a .map(ItemCard) callback across the site.
 * 
 * @param item - an {@link ItemData} object
 * @param index - a number from a map
 */
const ItemCard = (item: ItemData, index: number) => {
    return (
        <Col
            xs={12}
            sm={6}
            md={6}
            lg={4}
            xl={3}
            className="mb-4 d-flex align-items-stretch"
            style={{ minWidth: '280px', flexShrink: 0 }}
            key={`item-card-${index}`}
        >
            <div className="w-100 h-100 position-relative z-index-0">
                <ItemCardBody item={item} index={index} />
            </div>
        </Col>
    )
}

export default ItemCard;
