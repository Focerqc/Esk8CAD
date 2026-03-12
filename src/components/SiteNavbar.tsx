import { Link, useNavigate } from "react-router-dom"
import React, { useState } from "react"
import { Button, Container, Modal, Nav, Navbar, NavDropdown, Stack } from "react-bootstrap"
import { FaBars, FaMagnifyingGlass } from "react-icons/fa6"
import SearchModalCard from "./SearchModalCard"
import SearchModalSearchbar from "./SearchModalSearchbar"
import { useParts, Part } from "../util/parts"
import allResources from "../util/resources"
import { getSupabaseClient } from "../lib/supabase"
import { useEffect } from "react"

type NavPlatformDef = { label: string; href: string; divider?: never } | { divider: true; label?: never; href?: never };

const DEFAULT_PLATFORMS: NavPlatformDef[] = [
    { label: "Street (DIY/Generic)", href: "/parts?brand=Street%20(DIY/Generic)" },
    { label: "Off-Road (DIY/Generic)", href: "/parts?brand=Off-Road%20(DIY/Generic)" },
    { label: "Misc", href: "/parts?brand=Misc" },
    { divider: true },
    { label: "3D Servisas", href: "/parts?brand=3D%20Servisas" },
    { label: "Acedeck", href: "/parts?brand=Acedeck" },
    { label: "Apex Boards", href: "/parts?brand=Apex%20Boards" },
    { label: "Backfire", href: "/parts?brand=Backfire" },
    { label: "Bioboards", href: "/parts?brand=Bioboards" },
    { label: "Boardnamics", href: "/parts?brand=Boardnamics" },
    { label: "Defiant Board Society", href: "/parts?brand=Defiant%20Board%20Society" },
    { label: "Evolve", href: "/parts?brand=Evolve" },
    { label: "Exway", href: "/parts?brand=Exway" },
    { label: "Fluxmotion", href: "/parts?brand=Fluxmotion" },
    { label: "Hoyt St", href: "/parts?brand=Hoyt%20St" },
    { label: "Lacroix Boards", href: "/parts?brand=Lacroix%20Boards" },
    { label: "Linnpower", href: "/parts?brand=Linnpower" },
    { label: "MBoards", href: "/parts?brand=MBoards" },
    { label: "MBS", href: "/parts?brand=MBS" },
    { label: "Meepo", href: "/parts?brand=Meepo" },
    { label: "Newbee", href: "/parts?brand=Newbee" },
    { label: "Propel", href: "/parts?brand=Propel" },
    { label: "Radium Performance", href: "/parts?brand=Radium%20Performance" },
    { label: "Stooge Raceboards", href: "/parts?brand=Stooge%20Raceboards" },
    { label: "Summerboard", href: "/parts?brand=Summerboard" },
    { label: "Trampa Boards", href: "/parts?brand=Trampa%20Boards" },
    { label: "Wowgo", href: "/parts?brand=Wowgo" }
];

type NavbarProps = {
    isHomepage?: boolean
}


/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/navbar | React-Bootstrap Navbar}
 * for use navigating at the top of a page.
 * 
 * @param NavbarProps - a {@link NavbarProps} object
 */
export default ({ isHomepage }: NavbarProps) => {
    const navigate = useNavigate();
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
                            href: existingStatic ? existingStatic.href : `/parts?brand=${encodeURIComponent(p.name)}`
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

    // Merge Cloud Parts and Static Resources for search
    const allPartsAndResources = [...cloudParts, ...allResources].flat() as (Part | ResourceData)[]

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
                        max-height: 700px !important;
                        overflow-y: auto !important;
                    }
                    .dropdown-menu::-webkit-scrollbar {
                        width: 4px;
                    }
                    .dropdown-menu::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .dropdown-menu::-webkit-scrollbar-thumb {
                        background: #333;
                        border-radius: 10px;
                    }
                    @media (max-width: 991px) {
                        .navbar-collapse {
                            max-height: 80vh;
                            overflow-y: auto;
                            padding: 1rem 0;
                        }
                    }
                `}} />

                <Navbar.Brand as={Link} to="/" onClick={handleLogoClick} className="d-flex align-items-center gap-2">
                    <img
                        src="/images/logo.png"
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
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/parts?brand=OEM" style={{ color: '#00E5FF', fontWeight: '900' }}>OEM</Nav.Link>
                        <Nav.Link as={Link} to="/submit">Submit</Nav.Link>
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
                            <NavDropdown.Item as={Link} to="/resources/applications">Applications</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/repositories">Code Repositories</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/spreadsheets">Spreadsheets</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/vendors">Vendors</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/videoguides">Video Guides</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/websites">Websites</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/resources/writtenguides">Written Guides</NavDropdown.Item>
                        </NavDropdown>
                        <NavDropdown title="Get in contact" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-contribute-dropdown">
                            <div className="px-3 py-2 text-white small" style={{ minWidth: '160px' }}>
                                Email to:<br />
                                <span className="text-info fw-bold">Text@email.com</span>
                            </div>
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
