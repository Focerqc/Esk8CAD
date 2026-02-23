import React, { ChangeEvent, useEffect, useRef, useState, useMemo } from "react"
import { Alert, Button, ButtonGroup, Form, Spinner, Stack, ToggleButton, Row } from "react-bootstrap"
import { Link } from "gatsby"
import { FaArrowRotateLeft } from "react-icons/fa6"
import windowIsDefined from "../hooks/windowIsDefined"
import CopyLinkButton from "./CopyLinkButton"
import ItemCard from "./ItemCard"
import { useParts } from "../util/parts"
import { Part } from "../lib/supabase"

/**
 * Interface mapping to ensure ItemCard has access to ID even locally
 */
export interface MapItemData extends ItemData {
    id?: any;
}

/**
 * Maps Supabase `Part` back to `ItemData` so `ItemCard` can render it
 */
const mapPartToItemData = (part: Part): MapItemData => {
    return {
        // map id manually so card renderer can use it
        id: part.id as any,
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

// Helper to deduce platform directly from URL so we don't have to alter every platform page
const getPlatformFromURL = () => {
    if (!windowIsDefined()) return undefined;
    const path = window.location.pathname.toLowerCase();

    // Mapping URL paths to DB Platform items
    if (path.includes('/parts/street')) return 'Street (DIY/Generic)';
    if (path.includes('/parts/offroad')) return 'Off-Road (DIY/Generic)';
    if (path.includes('/parts/3dservisas')) return '3D Servisas';
    if (path.includes('/parts/acedeck')) return 'Acedeck';
    if (path.includes('/parts/apex')) return 'Apex Boards';
    if (path.includes('/parts/backfire')) return 'Backfire';
    if (path.includes('/parts/bioboards')) return 'Bioboards';
    if (path.includes('/parts/boardnamics')) return 'Boardnamics';
    if (path.includes('/parts/defiant')) return 'Defiant Board Society';
    if (path.includes('/parts/evolve')) return 'Evolve';
    if (path.includes('/parts/exway')) return 'Exway';
    if (path.includes('/parts/fluxmotion')) return 'Fluxmotion';
    if (path.includes('/parts/hoyt')) return 'Hoyt St';
    if (path.includes('/parts/lacroix')) return 'Lacroix Boards';
    if (path.includes('/parts/linnpower')) return 'Linnpower';
    if (path.includes('/parts/mboards')) return 'MBoards';
    if (path.includes('/parts/mbs')) return 'MBS';
    if (path.includes('/parts/meepo')) return 'Meepo';
    if (path.includes('/parts/newbee')) return 'Newbee';
    if (path.includes('/parts/propel')) return 'Propel';
    if (path.includes('/parts/radium')) return 'Radium Performance';
    if (path.includes('/parts/stooge')) return 'Stooge Raceboards';
    if (path.includes('/parts/summerboard')) return 'Summerboard';
    if (path.includes('/parts/trampa')) return 'Trampa Boards';
    if (path.includes('/parts/wowgo')) return 'Wowgo';
    if (path.includes('/parts/misc')) return 'Misc';

    return undefined;
};

/**
 * Creates a collection of elements for the
 * purpose of filtering an items page under
 * `src/pages/parts` using live Supabase data.
 */
export default ({ platformOverride }: { platformOverride?: string }) => {
    // Check if platform is explicitly passed or try deriving from URL
    const activePlatform = platformOverride || getPlatformFromURL();
    const { parts, isLoading, error } = useParts(activePlatform);

    // Arrays from live Supabase parts list
    const uniquePartTypes = [...new Set(parts.map((p) => (p.type_of_part || [])).filter(Boolean).flat())] as string[]
    const uniqueFabricationMethods = ["3d Printed", "CNC", "Laser", "Other", "PCB"]

    // Checkbox useState object lists
    const partTypeCheckboxes: Record<string, boolean> = Object.fromEntries(uniquePartTypes.map((p) => [p, false]));
    const fabricationMethodCheckboxes: Record<string, boolean> = Object.fromEntries(uniqueFabricationMethods.map((p) => [p, false]));

    // Set useStates
    const didMount = useRef(false)
    const [searchText, setSearchText] = useState("")
    const [checkedTypeBoxes, setCheckedTypeBoxes] = useState<Record<string, boolean>>(partTypeCheckboxes)
    const [checkedFabricationMethodBoxes, setCheckedFabricationMethodBoxes] = useState<Record<string, boolean>>(fabricationMethodCheckboxes)

    // Wait until parts have loaded so dynamic generic types register
    useEffect(() => {
        if (!isLoading && parts.length > 0) {
            setCheckedTypeBoxes(Object.fromEntries(uniquePartTypes.map((p) => [p, false])));
        }
    }, [isLoading, parts.length])

    const clearSearch = () => {
        setSearchText("")
        setCheckedTypeBoxes(Object.fromEntries(uniquePartTypes.map((p) => [p, false])))
        setCheckedFabricationMethodBoxes(fabricationMethodCheckboxes)
    }

    //#region Query Parameter Pre-Filtering

    if (!didMount.current && windowIsDefined()) {
        const queryParams = new URLSearchParams(window.location.search)

        const keyword = queryParams.get("keyword") ?? queryParams.get("search") ?? ""
        if (keyword) {
            setSearchText(decodeURIComponent(keyword))
        }

        const type = (queryParams.get("type")?.split(",") ?? []) as string[]
        if (type && type.every((t) => uniquePartTypes.includes(t))) {
            const tempCheckedTypeBoxes = structuredClone(checkedTypeBoxes)
            type.forEach((t) => tempCheckedTypeBoxes[t] = true)
            setCheckedTypeBoxes(tempCheckedTypeBoxes)
        }

        const fabricationMethod = (queryParams.get("fab")?.split(",") ?? queryParams.get("fabrication")?.split(",") ?? []) as string[]
        if (fabricationMethod && fabricationMethod.every((f) => uniqueFabricationMethods.includes(f))) {
            const tempCheckedFabricationMethodBoxes = structuredClone(checkedFabricationMethodBoxes)
            fabricationMethod.forEach((f) => tempCheckedFabricationMethodBoxes[f] = true)
            setCheckedFabricationMethodBoxes(tempCheckedFabricationMethodBoxes)
        }

        didMount.current = true
    }

    //#endregion

    const handleTypeCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
        setCheckedTypeBoxes({ ...checkedTypeBoxes, [e.target.name]: e.target.checked })
    }

    const handleFabricationMethodCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
        setCheckedFabricationMethodBoxes({ ...checkedFabricationMethodBoxes, [e.target.name]: e.target.checked })
    }

    const showCopySearchButton = useMemo(() => {
        return !!(
            searchText
            || Object.values(checkedTypeBoxes).some((v) => !!v)
            || Object.values(checkedFabricationMethodBoxes).some((v) => !!v)
        );
    }, [searchText, checkedTypeBoxes, checkedFabricationMethodBoxes]);

    const filteredParts = useMemo(() => {
        return parts.filter(part => {
            const partTypes = part.type_of_part || [];
            const partPlatforms = part.platform || [];
            const partFabs = part.fabrication_method || [];

            const searchTerm = searchText.toLowerCase().trim();
            const keywordMatch = !searchTerm || (
                (part.title?.toLowerCase().includes(searchTerm)) ||
                (partPlatforms.some(p => p?.toLowerCase().includes(searchTerm))) ||
                (partTypes.some(t => t?.toLowerCase().includes(searchTerm)))
            );

            const typeBoxesActive = Object.values(checkedTypeBoxes).some(v => !!v);
            const categoryMatch = !typeBoxesActive || partTypes.some(t => !!checkedTypeBoxes[t]);

            const fabBoxesActive = Object.values(checkedFabricationMethodBoxes).some(v => !!v);
            const fabMatch = !fabBoxesActive || partFabs.some(f => !!checkedFabricationMethodBoxes[f]);

            return keywordMatch && categoryMatch && fabMatch;
        });
    }, [parts, searchText, checkedTypeBoxes, checkedFabricationMethodBoxes]);

    return (
        <>
            <div className="searchArea">
                <Form.Label as="h2">
                    Search
                </Form.Label>

                <Stack direction="vertical" gap={3}>
                    <div className="searchKeyword">
                        <Form.Label htmlFor="inputSearch" as="h3">
                            Keyword:
                        </Form.Label>

                        <Form.Control
                            as="input"
                            type="search"
                            id="inputSearch"
                            value={searchText}
                            placeholder="Search text to filter by..."
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    {uniquePartTypes.length > 1 &&
                        <div className="searchTypeCheckBoxes">
                            <Form.Label as="h3">
                                Part Categories:
                            </Form.Label>

                            <ButtonGroup size="sm">
                                {uniquePartTypes.sort((a, b) => a.localeCompare(b)).map((t, index) => (
                                    <ToggleButton
                                        key={`partType-${index}`}
                                        checked={checkedTypeBoxes[t] || false}
                                        onChange={handleTypeCheckbox}
                                        name={t}
                                        id={t}
                                        type="checkbox"
                                        value={1}
                                        variant="outline-info">
                                        {t}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </div>
                    }

                    {uniqueFabricationMethods.length > 1 &&
                        <div className="searchFabricationCheckBoxes">
                            <Form.Label as="h3">
                                Fabrication Method(s):
                            </Form.Label>

                            <ButtonGroup size="sm">
                                {uniqueFabricationMethods.sort((a, b) => a.localeCompare(b)).map((f, index) => (
                                    <ToggleButton
                                        key={`fabricationMethod-${index}`}
                                        checked={checkedFabricationMethodBoxes[f] || false}
                                        onChange={handleFabricationMethodCheckbox}
                                        name={f}
                                        id={f}
                                        type="checkbox"
                                        value={1}
                                        variant="outline-info">
                                        {f}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </div>
                    }

                    <Stack direction="horizontal" gap={2}>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline-info"
                            style={{ display: showCopySearchButton ? "initial" : "none", maxWidth: "max-content" }}
                            onClick={() => clearSearch()}>
                            Clear Search <FaArrowRotateLeft />
                        </Button>

                        <CopyLinkButton
                            text="Copy This Search"
                            link={!windowIsDefined() ? "#" : "http://" + window.location.host + window.location.pathname + `?search=${encodeURIComponent(searchText)}` + `&type=${uniquePartTypes.filter((t) => !!checkedTypeBoxes[t])}` + `&fab=${uniqueFabricationMethods.filter((f) => !!checkedFabricationMethodBoxes[f])}`}
                            style={{ display: showCopySearchButton ? "initial" : "none", maxWidth: "max-content" }} />
                    </Stack>
                </Stack>

                <hr />
            </div>

            {/* Defensive Coding Data Display: Spinner, Error, Gallery Map */}
            {isLoading && (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" variant="info" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            )}

            {error && (
                <Alert variant="danger" className="my-4">
                    <strong>Error loading parts:</strong> {error}
                    {error.includes("Failed to fetch") && (
                        <div className="mt-2 text-muted small">
                            <em>Diagnostics: This network error typically means the database URL is missing or improperly formatted. Check browser environment variables.</em>
                        </div>
                    )}
                </Alert>
            )}

            {!isLoading && !error && (
                <>
                    <h2 id="itemListHeader" style={{ display: filteredParts.length > 0 ? "block" : "none" }}>Items From Cloud DB</h2>
                    <h2 id="noResultsText" style={{ display: filteredParts.length === 0 && parts.length > 0 ? "block" : "none", minHeight: "200px" }}>No results.</h2>

                    {/* Show a clear fallback message if filtering leaves zero rows */}
                    {parts.length === 0 ? (
                        <Alert variant="info" className="my-5 py-4 text-center border-0 shadow-sm" style={{ backgroundColor: "#1a1d20", minHeight: "150px" }}>
                            <h4 className="fw-bold mb-2">No parts found</h4>
                            <p className="mb-0 text-muted">There are currently no parts available for {activePlatform ? `the ${activePlatform} platform` : 'this search'} in the database.</p>
                        </Alert>
                    ) : (
                        <Row>
                            {filteredParts.map((part, index) => (
                                <Link key={`part-link-${index}`} to={`/parts/${part.platform[0]}`} style={{ textDecoration: 'none', color: 'inherit', display: 'contents' }}>
                                    {ItemCard(mapPartToItemData(part), index)}
                                </Link>
                            ))}
                        </Row>
                    )}
                </>
            )}
        </>
    )
}
