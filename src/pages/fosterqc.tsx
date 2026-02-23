import { type PageProps, Link } from "gatsby"
import React from "react"
import { Container, Button } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import { FaArrowLeft } from "react-icons/fa6"

const Page: React.FC<PageProps> = () => {
    return (
        <div className="bg-black text-light min-vh-100 flex-column d-flex">

            <SiteMetaData title="Fosterqc | ESK8CAD.COM" description="I am Quinn and I like CAD" /><header>
                <SiteNavbar />
                <div className="py-5 text-center">
                    <h1 className="display-4 fw-bold mb-0">Fosterqc</h1>
                </div>
            </header>

            <main className="flex-grow-1">
                <Container className="text-center py-5">
                    <div className="mx-auto" style={{ maxWidth: '600px' }}>
                        <p className="lead mb-5">I am Quinn and I like CAD</p>

                        <pre className="mb-5 mx-auto d-inline-block text-start" style={{ fontSize: '1rem', lineHeight: '1.1', color: '#fff', opacity: '0.8', whiteSpace: 'pre', fontFamily: 'monospace', overflow: 'hidden', background: 'transparent', border: 'none' }}>
                            {`
⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣤⣴⣦⣤⣤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣴⠾⠛⠉⠉⠀⠀⠀⠀⠈⠉⠛⠿⣦⣄⠀⠀⠀⠀⠀
⠀⠀⣠⣾⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢷⣄⠀⠀⠀
⠀⣰⡟⠁⠀⠀⠀⣀⡤⡀⠀⠀⠀⠀⠀⣠⢄⠀⠀⠀⠀⠻⣧⠀⠀
⣰⡟⠀⠀⠀⠀⢰⣿⣿⣷⠀⠀⠀⠀⣼⣿⣿⡇⠀⠀⠀⠀⢻⣧⠀
⣿⠃⠀⠀⠀⠀⠘⣿⣿⡿⠀⠀⠀⠀⢹⣿⣿⠇⠀⠀⠀⠀⠈⣿⡄
⣿⠀⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⠀⠀⠀⠉⠉⠀⠀⠀⠀⠀⠀⣿⡇
⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠃
⠹⣧⠀⠀⠀⢳⣤⣄⣀⡀⠀⠀⠀⠀⠀⣀⣀⣤⡾⠀⠀⠀⣸⡟⠀
⠀⠻⣧⡀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⣴⡟⠀⠀
⠀⠀⠙⢷⣄⡀⠀⠈⠛⠿⣿⣿⣿⣿⠿⠟⠋⠀⠀⣠⣾⠏⠀⠀⠀
⠀⠀⠀⠀⠙⠻⣶⣤⣀⡀⠀⠀⠀⠀⠀⣀⣠⣴⠿⠋⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠿⠿⠛⠛⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀
`}
                        </pre>

                        <Button as={Link as any} to="/" variant="outline-info" size="sm">
                            <FaArrowLeft className="me-2" /> Back Home
                        </Button>
                    </div>
                </Container>
            </main>

            <SiteFooter />
        </div>
    )
}

export default Page
