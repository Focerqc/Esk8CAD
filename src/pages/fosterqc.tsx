import React from 'react';
import { Container, Row, Col, Badge, Stack } from 'react-bootstrap';
import SiteNavbar from '../components/SiteNavbar';
import SiteFooter from '../components/SiteFooter';
import SiteMetaData from '../components/SiteMetaData';
import { FaGithub, FaEnvelope, FaCode, FaDatabase, FaFilter } from 'react-icons/fa6';

const FosterqcPage: React.FC = () => {
    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <SiteMetaData title="About fosterqc | ESK8CAD" />
            <SiteNavbar />
            
            <main className="flex-grow-1 py-5 mt-5">
                <Container className="py-5">
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h1 className="display-3 fw-black tracking-tighter mb-2">fosterqc</h1>
                                <Badge bg="info" className="text-dark px-3 py-2 uppercase letter-spacing-1">Developer & Architect</Badge>
                            </div>

                            <div className="glass-card p-4 p-md-5 border border-zinc-800 rounded-4 bg-zinc-900/30 backdrop-blur-sm mb-5">
                                <h2 className="h4 fw-bold text-info mb-4 uppercase letter-spacing-1">About Me</h2>
                                <div className="lead opacity-75 space-y-4">
                                    <p>
                                        Hey, I'm Quinn (aka fosterqc). I specialize in building the technical infrastructure that powers community-driven platforms like ESK8CAD.COM.
                                    </p>
                                    <p>
                                        My focus on this project has been transforming it from a simple list into a powerful, searchable database. I built the <strong>Make/Model</strong> and <strong>Brand/Board</strong> filtering systems, the <strong>Supabase database integration</strong>, and the entire <strong>Submit/Admin ecosystem</strong>.
                                    </p>
                                    <p>
                                        One of my key contributions is the <strong>Attribute Tagging System</strong>, which allows users to filter by specific dimensions like wheel diameter, width, and motor diameter—enabling precise searches without relying on keywords in titles.
                                    </p>
                                </div>
                            </div>

                            <Row className="g-4 mb-5">
                                <Col md={4}>
                                    <div className="h-100 p-4 border border-zinc-800 rounded-4 bg-zinc-900/20 text-center">
                                        <FaDatabase className="text-info fs-2 mb-3" />
                                        <h3 className="h6 fw-bold uppercase mb-2">Database</h3>
                                        <p className="small opacity-50 mb-0">Full Supabase architecture & Admin management.</p>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="h-100 p-4 border border-zinc-800 rounded-4 bg-zinc-900/20 text-center">
                                        <FaFilter className="text-info fs-2 mb-3" />
                                        <h3 className="h6 fw-bold uppercase mb-2">Filtering</h3>
                                        <p className="small opacity-50 mb-0">Advanced Make/Model & Attribute search systems.</p>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="h-100 p-4 border border-zinc-800 rounded-4 bg-zinc-900/20 text-center">
                                        <FaCode className="text-info fs-2 mb-3" />
                                        <h3 className="h6 fw-bold uppercase mb-2">Submissions</h3>
                                        <p className="small opacity-50 mb-0">Streamlined community part submission workflow.</p>
                                    </div>
                                </Col>
                            </Row>

                            <Row className="justify-content-center">
                                <Col md={6}>
                                    <div className="p-4 border border-zinc-800 rounded-4 bg-zinc-900/20">
                                        <h3 className="h6 fw-bold text-secondary uppercase mb-3">Connect</h3>
                                        <Stack gap={3}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 bg-info/10 text-info rounded-3">
                                                    <FaEnvelope />
                                                </div>
                                                <span className="opacity-75">Text@email.com</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 bg-info/10 text-info rounded-3">
                                                    <FaGithub />
                                                </div>
                                                <a href="https://github.com/Focerqc" className="text-light text-decoration-none opacity-75 hover-opacity-100">github.com/Focerqc</a>
                                            </div>
                                        </Stack>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{ __html: `
                .fw-black { font-weight: 900; }
                .tracking-tighter { letter-spacing: -0.05em; }
                .letter-spacing-1 { letter-spacing: 0.1em; }
                .uppercase { text-transform: uppercase; }
                .glass-card {
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }
                .space-y-4 > * + * {
                    margin-top: 1.5rem;
                }
            `}} />
        </div>
    );
};

export default FosterqcPage;
