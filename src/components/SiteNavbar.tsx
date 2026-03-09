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
import { Part, getSupabaseClient } from "../lib/supabase"
import { useEffect } from "react"

type NavPlatformDef = { label: string; href: string; divider?: never } | { divider: true; label?: never; href?: never };

const DEFAULT_PLATFORMS: NavPlatformDef[] = [
    { label: "Street (DIY/Generic)", href: "/street" },
    { label: "Off-Road (DIY/Generic)", href: "/offroad" },
    { label: "Misc", href: "/misc" },
    { divider: true },
    { label: "3D Servisas", href: "/3dservisas" },
    { label: "Acedeck", href: "/acedeck" },
    { label: "Apex Boards", href: "/apex" },
    { label: "Backfire", href: "/backfire" },
    { label: "Bioboards", href: "/bioboards" },
    { label: "Boardnamics", href: "/boardnamics" },
    { label: "Defiant Board Society", href: "/defiant" },
    { label: "Evolve", href: "/evolve" },
    { label: "Exway", href: "/exway" },
    { label: "Fluxmotion", href: "/fluxmotion" },
    { label: "Hoyt St", href: "/hoyt" },
    { label: "Lacroix Boards", href: "/lacroix" },
    { label: "Linnpower", href: "/linnpower" },
    { label: "MBoards", href: "/mboards" },
    { label: "MBS", href: "/mbs" },
    { label: "Meepo", href: "/meepo" },
    { label: "Newbee", href: "/newbee" },
    { label: "Propel", href: "/propel" },
    { label: "Radium Performance", href: "/radium" },
    { label: "Stooge Raceboards", href: "/stooge" },
    { label: "Summerboard", href: "/summerboard" },
    { label: "Trampa Boards", href: "/trampa" },
    { label: "Wowgo", href: "/wowgo" }
];

type NavbarProps = {
    isHomepage?: boolean
}

const mapPartToItemData = (part: Part): ItemData => {
    return {
        id: part.id,
        title: part.title,
        typeOfPart: (part.type_of_part && part.type_of_part.length > 0 ? part.type_of_part : ["Miscellaneous"]) as PartType[],
        fabricationMethod: (part.fabrication_method && part.fabrication_method.length > 0 ? part.fabrication_method : ["Other"]) as FabricationMethod[],
        imageSrc: (Array.isArray(part.image_src) ? part.image_src[0] : part.image_src) || "",
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

    // Dynamic Navbar Platforms
    const [navPlatforms, setNavPlatforms] = useState<typeof DEFAULT_PLATFORMS>(DEFAULT_PLATFORMS)

    useEffect(() => {
        let isMounted = true;
        const fetchPlatforms = async () => {
            try {
                const client = getSupabaseClient();
                if (!client) return;
                const { data } = await client.from('brands').select('name').order('name');
                if (data && data.length > 0 && isMounted) {
                    const dynamicPlatforms: typeof DEFAULT_PLATFORMS = [];
                    // Keep pinned manual items at top
                    dynamicPlatforms.push(DEFAULT_PLATFORMS[0], DEFAULT_PLATFORMS[1], DEFAULT_PLATFORMS[2], DEFAULT_PLATFORMS[3]);

                    const alphabetic = data.filter(p => !["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc"].includes(p.name));

                    alphabetic.forEach(p => {
                        const existingStatic = DEFAULT_PLATFORMS.find(dp => dp.label === p.name);
                        dynamicPlatforms.push({
                            label: p.name,
                            href: existingStatic ? existingStatic.href : `/brand/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
                        } as NavPlatformDef);
                    });
                    setNavPlatforms(dynamicPlatforms);
                }
            } catch (e) {
                console.error("Failed to load nav platforms dynamically", e);
            }
        };
        fetchPlatforms();
        return () => { isMounted = false; };
    }, []);

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
        <Navbar fixed="top" expand="lg" data-bs-theme="dark" className="border-bottom border-zinc-800 backdrop-blur-md bg-black/80">
            <Container>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .navbar-brand img {
                        transition: all 0.3s ease;
                    }
                    .navbar-brand:hover img {
                        transform: scale(1.05);
                    }
                    .nav-link {
                        font-weight: 500;
                        letter-spacing: 0.02em;
                        transition: color 0.2s ease;
                    }
                    .dropdown-menu {
                        background-color: #090a0b !important;
                        border: 1px solid #24282d !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    }
                    @media (max-width: 991px) {
                        .navbar-collapse {
                            max-height: 80vh;
                            overflow-y: auto;
                            padding: 1rem 0;
                        }
                    }
                `}} />

                <Navbar.Brand href="/" onClick={handleLogoClick} className="d-flex align-items-center gap-2">
                    <StaticImage
                        src="../../static/images/logo.png"
                        width={45}
                        height={45}
                        className={(isSpinning ? " spin-once" : "")}
                        alt="ESK8CAD.COM logo" />

                    <span className="fw-black tracking-tighter fs-4 uppercase">
                        ESK8CAD.COM
                    </span>
                </Navbar.Brand>

                <div className="d-flex align-items-center gap-3 order-lg-3">
                    <Nav.Link as={Link} to="/fosterqc" className="d-none d-md-block opacity-50 hover-opacity-100" style={{ fontSize: '0.8rem' }}>
                        BY FOSTERQC
                    </Nav.Link>

                    {/* Desktop Search Button */}
                    <Button
                        variant="link"
                        className="p-2 text-white opacity-75 hover-opacity-100 d-none d-lg-block"
                        onClick={() => setShowModal(true)}
                        aria-label="Sitewide search modal trigger"
                    >
                        <FaMagnifyingGlass />
                    </Button>

                    <Stack direction="horizontal" gap={2} className="d-lg-none">
                        <Button variant="link" className="p-2 text-white" onClick={() => setShowModal(true)} aria-label="Mobile search"><FaMagnifyingGlass /></Button>
                        <Navbar.Toggle aria-controls="site-navbar" className="border-0 p-2">
                            <FaBars />
                        </Navbar.Toggle>
                    </Stack>
                </div>

                <Navbar.Collapse id="site-navbar" className="order-lg-2">
                    <Nav className="ms-auto me-lg-4 gap-lg-2">
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/submit">Submit</Nav.Link>
                        <Nav.Link as={Link} to="/oem" style={{ color: '#00E5FF', fontWeight: '900' }}>OEM</Nav.Link>
                        <NavDropdown title="Board Platforms" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-parts-dropdown">
                            {navPlatforms.map((p, index) => {
                                if (p.divider) return <NavDropdown.Divider key={`nav-divider-${index}`} />;
                                return (
                                    <NavDropdown.Item key={p.label} as={Link} to={p.href!}>
                                        {p.label}
                                    </NavDropdown.Item>
                                );
                            })}
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
