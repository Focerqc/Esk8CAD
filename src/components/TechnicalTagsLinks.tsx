import React from "react"
import { Button, Spinner, Alert } from "react-bootstrap"
import { usePartCategories } from "../lib/supabase"

/**
 * TechnicalTagsLinks: Displays all technical part categories (Tags).
 * Unified to fetch from the Supabase 'part_categories' table.
 */
const TechnicalTagsLinks: React.FC = () => {
    const { categories, isLoading, error } = usePartCategories();

    if (isLoading) {
        return (
            <div className="py-5 text-center opacity-75">
                <Spinner animation="border" size="sm" variant="success" className="me-2" />
                <span className="small fw-bold uppercase letter-spacing-1 text-success">Loading Part Categories...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="py-3 px-4 small border-1 border-danger bg-black text-danger fw-bold shadow-sm">
                <div className="d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Database Error: {error}</span>
                    <Button
                        variant="link"
                        onClick={() => typeof window !== 'undefined' && window.location.reload()}
                        className="p-0 text-danger text-decoration-underline small fw-bold ms-2"
                    >
                        Retry
                    </Button>
                </div>
            </Alert>
        );
    }

    return (
        <div className="d-flex flex-wrap gap-2 mb-4" style={{ overflow: 'visible' }}>
            {categories.map(category => (
                <Button
                    key={category.id}
                    variant="outline-success"
                    href={`/parts/tags/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-3 py-1 border-1 fw-semibold"
                    style={{
                        fontSize: '0.85rem',
                        minWidth: '100px',
                        flex: '1 0 auto',
                        maxWidth: 'fit-content',
                        transition: 'all 0.15s ease',
                        opacity: 0.8
                    }}
                >
                    {category.name}
                </Button>
            ))}
        </div>
    )
}

export default TechnicalTagsLinks
