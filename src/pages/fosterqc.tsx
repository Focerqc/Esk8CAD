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

                            <div className="glass-card p-4 p-md-5 border border-zinc-800 rounded-4 bg-zinc-900/30 backdrop-blur-sm mb-5 shadow-lg">
                                <h2 className="h4 fw-bold text-info mb-4 uppercase letter-spacing-1 border-bottom border-secondary border-opacity-25 pb-2">About Me</h2>
                                <div className="lead opacity-75 space-y-4">
                                    <p>
                                        Hey, I'm Quinn (aka fosterqc). I build tools and libraries for the ESK8 and PEV communities.
                                    </p>
                                    <p>
                                        ESK8CAD.COM was born out of a need for a centralized, curated repository of CAD files for electric skateboards. Whether you're a DIY builder looking for motor mounts or an OEM designer checking tolerances, this project is for you.
                                    </p>
                                    <p>
                                        I also help run <strong>PubParts.xyz</strong> (made by ZiNc) for the Onewheel community.
                                    </p>
                                </div>
                            </div>

                            <Row className="g-4 mb-5">
                                <Col md={6}>
                                    <div className="h-100 p-4 border border-zinc-800 rounded-4 bg-zinc-900/20">
                                        <h3 className="h6 fw-bold text-secondary uppercase mb-3 letter-spacing-1">Get in Touch</h3>
                                        <Stack gap={3}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 bg-info/10 text-info rounded-3">
                                                    <FaEnvelope />
                                                </div>
                                                <span className="opacity-75 small">Text@email.com</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 bg-info/10 text-info rounded-3">
                                                    <FaGithub />
                                                </div>
                                                <a href="https://github.com/Focerqc" className="text-light text-decoration-none opacity-75 hover-opacity-100 small">github.com/Focerqc</a>
                                            </div>
                                        </Stack>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="h-100 p-4 border border-zinc-800 rounded-4 bg-zinc-900/20">
                                        <h3 className="h6 fw-bold text-secondary uppercase mb-3 letter-spacing-1">Other Projects</h3>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fw-bold text-light">PubParts.xyz</span>
                                            <a href="https://pubparts.xyz" target="_blank" rel="noreferrer" className="text-info"><FaFilter /></a>
                                        </div>
                                        <p className="extreme-small opacity-50 mb-0">The community parts library for Onewheel. (Project by ZiNc)</p>
                                        <div className="mt-3 pt-3 border-top border-secondary border-opacity-10">
                                            <p className="extreme-small opacity-25 italic">More projects coming soon...</p>
                                        </div>
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
