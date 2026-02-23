import React from "react"
import { Button } from "react-bootstrap"

export default () => (
    <div className="d-flex flex-wrap gap-3 mb-4">
        {[
            { label: "Applications", href: "/resources/applications" },
            { label: "Code Repositories", href: "/resources/repositories" },
            { label: "Spreadsheets", href: "/resources/spreadsheets" },
            { label: "Vendors", href: "/resources/vendors" },
            { label: "Video Guides", href: "/resources/videoguides" },
            { label: "Websites", href: "/resources/websites" },
            { label: "Written Guides", href: "/resources/writtenguides" }
        ].map(resource => (
            <Button
                key={resource.href}
                variant="outline"
                href={resource.href}
                className="px-4 py-2"
                style={{
                    fontSize: '0.9rem',
                    minWidth: 'fit-content',
                    color: '#800000',
                    borderColor: '#800000',
                    borderWidth: '2px',
                    fontWeight: 'bold'
                }}
            >
                {resource.label}
            </Button>
        ))}
    </div>
)
