import { type PageProps } from "gatsby"
import React, { useMemo } from "react"
import { Container, Row, Button } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ItemCard from "../components/ItemCard"
import allParts, { useParts } from "../util/parts"
import usePartRegistry from "../hooks/usePartRegistry"
import { Part } from "../lib/supabase"

const mapPartToItemData = (part: Part): any => ({
    id: part.id as any,
    title: part.title,
    typeOfPart: (part.type_of_part && part.type_of_part.length > 0 ? part.type_of_part : ["Miscellaneous"]),
    fabricationMethod: (part.fabrication_method && part.fabrication_method.length > 0 ? part.fabrication_method : ["Other"]),
    imageSrc: part.image_src || "",
    platform: (part.platform && part.platform.length > 0 ? part.platform : ["Misc"]),
    externalUrl: part.external_url || undefined,
    dropboxZipLastUpdated: "",
    isOem: part.is_oem
});

const OemPage: React.FC<PageProps> = () => {
    const registryParts = usePartRegistry();
    const { parts: cloudParts } = useParts(); // Fetch live database parts

    const combinedParts = useMemo(() => {
        const uniquePartsMap = new Map<string, any>();
        [...allParts, ...registryParts].forEach((p) => { if (p.title) uniquePartsMap.set(p.title, p); });
        cloudParts.map(mapPartToItemData).forEach((p) => { if (p.title) uniquePartsMap.set(p.title, p); });
        return Array.from(uniquePartsMap.values());
    }, [registryParts, cloudParts]);

    // Filter logic: Check for "OEM" or "OEM PART" tags
    const oemParts = useMemo(() => {
        return combinedParts.filter(p =>
            (p.typeOfPart && p.typeOfPart.some((tag: string) => tag.toUpperCase().includes("OEM"))) ||
            p.isOem
        );
    }, [combinedParts]);

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <SiteMetaData
                title="OEM Parts | ESK8CAD.COM"
                description="Verified OEM replacement parts for electric skateboards."
            />
            <SiteNavbar />

            <header className="py-5 text-center border-bottom border-secondary mb-4">
                <Container>
                    <h1 className="display-4 fw-bold text-success mb-2 uppercase letter-spacing-1">OEM Certified Parts</h1>
                    <p className="opacity-75 lead" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Verified replacement components from original manufacturers.
                    </p>
                </Container>
            </header>

            <main className="flex-grow-1">
                <Container>
                    {oemParts.length > 0 ? (
                        <Row className="g-4">
                            {oemParts.map((part, idx) => ItemCard(part, idx))}
                        </Row>
                    ) : (
                        <div className="text-center py-5">
                            <h3 className="text-muted fw-bold mb-3">No OEM parts found yet.</h3>
                            <p className="opacity-50 mb-4">Be the first to contribute a verified manufacturer part!</p>
                            <Button variant="success" size="lg" href="/submit">Submit OEM Part</Button>
                        </div>
                    )}
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
                .border-secondary { border-color: #24282d !important; }
            `}} />
        </div>
    )
}

export default OemPage
