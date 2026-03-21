import React from "react";
import { Card } from "react-bootstrap";

const SkeletonCard = () => {
    return (
        <>
        <div className="w-100 h-100 position-relative z-index-0 align-items-stretch">
                <Card className="h-100 shadow-sm border-secondary skeleton-card bg-dark text-light overflow-hidden">
                    {/* Image Area placeholder */}
                    <div 
                        className="skeleton-pulse" 
                        style={{ aspectRatio: "16 / 9", width: "100%", backgroundColor: "#1e293b" }}
                    />
                    
                    <Card.Body className="d-flex flex-column">
                        {/* Title placeholder */}
                        <div className="skeleton-pulse mb-2" style={{ height: "24px", width: "80%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                        
                        {/* Author placeholder */}
                        <div className="skeleton-pulse mb-4" style={{ height: "16px", width: "50%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                        
                        <div className="mb-3">
                            {/* Brand placeholder */}
                            <div className="skeleton-pulse mb-3" style={{ height: "18px", width: "40%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                            
                            {/* Tags/Badges placeholder */}
                            <div className="d-flex gap-2">
                                <div className="skeleton-pulse" style={{ height: "24px", width: "60px", backgroundColor: "#1e293b", borderRadius: "8px" }} />
                                <div className="skeleton-pulse" style={{ height: "24px", width: "80px", backgroundColor: "#1e293b", borderRadius: "8px" }} />
                            </div>
                        </div>

                        {/* Button placeholders */}
                        <div className="mt-auto pt-3 border-top border-secondary">
                            <div className="skeleton-pulse mb-2" style={{ height: "31px", width: "100%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                            <div className="skeleton-pulse" style={{ height: "31px", width: "100%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                        </div>
                    </Card.Body>
                </Card>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
                .skeleton-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
            `}} />
        </>
    );
};

export default SkeletonCard;
