import { type PageProps } from "gatsby"
import React, { useState, useEffect } from "react"
import { Container } from "react-bootstrap"
import ItemListSearchbar from "../components/ItemListSearchbar"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import windowIsDefined from "../hooks/windowIsDefined"
import "../scss/pages/items.scss"

const Page: React.FC<PageProps> = () => {
    const [activeTag, setActiveTag] = useState<string | null>(null);

    useEffect(() => {
        if (!windowIsDefined()) return;
        const path = window.location.pathname.toLowerCase();
        const segments = path.split('/').filter(Boolean);

        if (segments[0] === 'tags' && segments.length > 1) {
            const rawTag = segments[1];
            // Convert slug to Display Name (e.g. motor-mount -> Motor Mount)
            const tagName = rawTag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            setActiveTag(tagName);
        } else {
            setActiveTag("All Categories");
        }
    }, []);

    if (!activeTag) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
                <SiteMetaData title="Part Categories | ESK8CAD.COM" />
                <SiteNavbar />
                <main className="flex-grow-1">
                    <Container className="my-5">
                        <div className="p-5 text-center">
                            <h2 className="text-info fw-black text-uppercase italic">Syncing categories...</h2>
                        </div>
                    </Container>
                </main>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5 page-items">
            <SiteMetaData title={`${activeTag} | ESK8CAD.COM`} description={`Open source ${activeTag} components for electric skateboards`} />
            <header>
                <SiteNavbar />
                <h1 className="flex-center text-uppercase italic fw-black mb-0" style={{ letterSpacing: '0.1em', paddingTop: '2rem' }}>
                    {activeTag}
                </h1>
            </header>
            <main className="page-items flex-grow-1">
                <Container>
                    <ItemListSearchbar />
                </Container>
            </main>
            <SiteFooter />
        </div>
    )
}

export default Page
