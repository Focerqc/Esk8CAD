import { Link, navigate } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import React, { useState } from "react"
import { Button, Container, Modal, Nav, Navbar, NavDropdown, Stack } from "react-bootstrap"
import { FaBars, FaMagnifyingGlass } from "react-icons/fa6"
import { DiscordInvite, DiscordThread } from "../util/siteVariables"
import SearchModalCard from "./SearchModalCard"
import SearchModalSearchbar from "./SearchModalSearchbar"
import allParts, { useParts } from "../util/parts"
import allResources from "../util/resources"
import usePartRegistry from "../hooks/usePartRegistry"
import { Part } from "../lib/supabase"

type NavbarProps = {
    isHomepage?: boolean
}

const mapPartToItemData = (part: Part): ItemData => {
    return {
        id: part.id,
        title: part.title,
        typeOfPart: (part.type_of_part && part.type_of_part.length > 0 ? part.type_of_part : ["Miscellaneous"]) as PartType[],
        fabricationMethod: (part.fabrication_method && part.fabrication_method.length > 0 ? part.fabrication_method : ["Other"]) as FabricationMethod[],
        imageSrc: part.image_src || "",
        platform: (part.platform && part.platform.length > 0 ? part.platform : ["Misc"]) as PlatformType[],
        externalUrl: part.external_url || undefined,
        dropboxZipLastUpdated: "",
        isOem: part.is_oem
    }
}

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/navbar | React-Bootstrap Navbar}
 * for use navigating at the top of a page.
 * 
 * @param NavbarProps - a {@link NavbarProps} object
 */
export default ({ isHomepage }: NavbarProps) => {
    const registryParts = usePartRegistry();
    const { parts: cloudParts } = useParts(); // Fetch live database parts
    const [showModal, setShowModal] = useState(false)
    const [isSpinning, setIsSpinning] = useState(false)

    // Deduplicate parts by title (since JSON to Supabase migration could duplicate them)
    const uniquePartsMap = new Map<string, ItemData>();

    // Legacy static/JSON array merges
    [...allParts, ...registryParts].forEach((p) => {
        if (p.title) uniquePartsMap.set(p.title, p as ItemData);
    });

    // Cloud overrides/appends
    cloudParts.map(mapPartToItemData).forEach((p) => {
        if (p.title) uniquePartsMap.set(p.title, p);
    });

    const dedupedParts = Array.from(uniquePartsMap.values());

    // Merge static and registry parts
    const allPartsAndResources = [...dedupedParts, ...allResources].flat() as (ItemData | ResourceData)[]

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsSpinning(true);
        setTimeout(() => {
            setIsSpinning(false);
            navigate('/');
        }, 600); // match animation duration
    };

    return (
        <Navbar fixed="top" expand="lg" data-bs-theme="dark">
            <Container>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 991px) {
                        .navbar-collapse {
                            max-height: 80vh;
                            overflow-y: auto;
                        }
                    }
                    .dropdown-menu.show {
                        max-height: 65vh !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        border: 1px solid #24282d !important;
                        background-color: #090a0b !important;
                        scrollbar-width: thin;
                        scrollbar-color: #0dcaf0 #121417;
                    }
                    /* Reset for hidden state to allow Bootstrap/custom transitions to work */
                    .dropdown-menu:not(.show) {
                        max-height: 0 !important;
                        border: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important; 
                        overflow: hidden !important;
                    }
                    .dropdown-item {
                        padding: 0.75rem 1.5rem !important;
                        font-size: 1rem !important;
                        transition: all 0.2s ease;
                        color: #adb5bd; /* Ensure text is visible */
                    }
                    .dropdown-item:hover {
                        background-color: #121417 !important;
                        color: #0dcaf0 !important;
                        padding-left: 1.75rem !important;
                    }
                    .dropdown-menu::-webkit-scrollbar {
                        width: 8px;
                    }
                    .dropdown-menu::-webkit-scrollbar-track {
                        background: #090a0b;
                    }
                    .dropdown-menu::-webkit-scrollbar-thumb {
                        background-color: #24282d;
                        border-radius: 10px;
                        border: 2px solid #090a0b;
                    }
                    .dropdown-menu::-webkit-scrollbar-thumb:hover {
                        background-color: #0dcaf0;
                    }
                `}} />
                <Navbar.Brand href="/" onClick={handleLogoClick}>
                    <StaticImage
                        src="../../static/images/logo.png"
                        width={55}
                        height={55}
                        className={(isHomepage ? "d-inline-block" : "d-xs-inline-block d-md-none") + " align-top" + (isSpinning ? " spin-once" : "")}
                        alt="ESK8CAD.COM logo" />

                    <span className={(isHomepage ? "d-none" : "d-none d-md-inline-block")}>
                        ESK8CAD.COM
                    </span>
                </Navbar.Brand>

                <Nav.Link as={Link} to="/fosterqc" className="ms-2 opacity-75 hover-opacity-100 me-auto" style={{ fontSize: '0.9rem' }}>
                    Fosterqc
                </Nav.Link>

                <Stack direction="horizontal" gap={3}>
                    {/* Mobile Search Button */}
                    <Nav.Link className="d-md-block d-lg-none navbar-toggler" onClick={() => setShowModal(true)} aria-label="Sitewide search modal trigger"><FaMagnifyingGlass style={{ height: "1rem", width: "1rem" }} /></Nav.Link>
                    {/* Mobile Navigation Toggle */}
                    <Navbar.Toggle label="Menu toggle" aria-controls="site-navbar"><FaBars style={{ height: "1rem", width: "1rem" }} /></Navbar.Toggle>
                </Stack>

                {/* Navbar */}
                <Navbar.Collapse id="site-navbar">
                    <Nav variant="underline" justify>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/submit">Submit</Nav.Link>
                        <Nav.Link as={Link} to="/oem" style={{ color: '#a855f7', fontWeight: 'bold' }}>OEM</Nav.Link>
                        <NavDropdown title="Board Platforms" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-parts-dropdown">
                            <NavDropdown.Item as={Link} to="/parts/street">Street (DIY/Generic)</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/offroad">Off-Road (DIY/Generic)</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/misc">Misc</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item as={Link} to="/parts/3dservisas">3D Servisas</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/acedeck">Acedeck</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/apex">Apex Boards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/backfire">Backfire</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/bioboards">Bioboards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/boardnamics">Boardnamics</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/defiant">Defiant Board Society</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/evolve">Evolve</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/exway">Exway</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/fluxmotion">Fluxmotion</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/hoyt">Hoyt St</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/lacroix">Lacroix Boards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/linnpower">Linnpower</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/mboards">MBoards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/mbs">MBS</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/meepo">Meepo</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/newbee">Newbee</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/propel">Propel</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/radium">Radium Performance</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/stooge">Stooge Raceboards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/summerboard">Summerboard</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/trampa">Trampa Boards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/wowgo">Wowgo</NavDropdown.Item>
                        </NavDropdown>
                        <NavDropdown title="Resources" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-resources-dropdown">
                            <NavDropdown.Item href="/resources/applications" target="_self">Applications</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/repositories" target="_self">Code Repositories</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/spreadsheets" target="_self">Spreadsheets</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/vendors" target="_self">Vendors</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/videoguides" target="_self">Video Guides</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/websites" target="_self">Websites</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/writtenguides" target="_self">Written Guides</NavDropdown.Item>
                        </NavDropdown>
                        <NavDropdown title="Get in contact" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-contribute-dropdown">
                            <NavDropdown.Item href={DiscordInvite} target="_blank">1. Join Vescify Discord</NavDropdown.Item>
                            <NavDropdown.Item href={DiscordThread} target="_blank">2. Post in Thread</NavDropdown.Item>
                        </NavDropdown>
                        {/* Desktop Search Button */}
                        <Nav.Link className="d-none d-lg-block" onClick={() => setShowModal(true)} aria-label="Sitewide search modal trigger"><FaMagnifyingGlass /></Nav.Link>
                    </Nav>
                </Navbar.Collapse>

                {/* Search Modal */}
                <Modal
                    show={showModal}
                    variant="outline-info"
                    size="lg"
                    fullscreen="md-down"
                    centered={true}
                    onHide={() => setShowModal(false)}
                    scrollable={true}>
                    <Modal.Header>
                        <Modal.Title>Sitewide Search</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {/* Search area */}
                        <SearchModalSearchbar />

                        <Stack direction="vertical" gap={3}>
                            {/* List parts */}
                            {!!allPartsAndResources.length &&
                                allPartsAndResources.map(SearchModalCard)
                            }
                        </Stack>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="outline-info" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </Navbar>
    )
}
