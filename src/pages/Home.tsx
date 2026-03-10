import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import SiteNavbar from '../components/SiteNavbar';
import SiteFooter from '../components/SiteFooter';
import SiteMetaData from '../components/SiteMetaData';
import PartTypesLinks from '../components/PartTypesLinks';

const Home = () => {
    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <SiteMetaData title="Esk8CAD | Open Source Electric Skateboard Parts" />
            <SiteNavbar isHomepage={true} />

            <main className="flex-grow-1" style={{ paddingTop: '100px' }}>
                <section className="hero-section py-5 text-center">
                    <Container>
                        <h1 className="display-2 fw-black mb-3 tracking-tighter uppercase">
                            ESK8CAD
                        </h1>
                        <p className="lead fs-4 opacity-75 mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                            The open catalog for electric skateboard components.
                            Browse CAD files, performance reviews, and technical datasets.
                        </p>
                    </Container>
                </section>

                <section className="brands-section py-5 bg-zinc-950">
                    <Container>
                        <div className="d-flex align-items-center gap-3 mb-5">
                            <h2 className="fs-3 fw-bold uppercase tracking-widest text-info m-0">Platforms</h2>
                            <div className="h-px bg-info opacity-25 flex-grow-1"></div>
                        </div>
                        <PartTypesLinks />
                    </Container>
                </section>

                <section className="features-section py-5 mt-5">
                    <Container>
                        <Row className="g-4">
                            <Col md={4}>
                                <Card className="bg-zinc-900 border-zinc-800 h-100 p-3">
                                    <Card.Body>
                                        <h3 className="fs-5 fw-bold mb-3 text-info">CAD Library</h3>
                                        <p className="small opacity-75">Access a growing repository of open-source and legacy mechanical designs for electric skateboards.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="bg-zinc-900 border-zinc-800 h-100 p-3">
                                    <Card.Body>
                                        <h3 className="fs-5 fw-bold mb-3 text-info">Vendor Directory</h3>
                                        <p className="small opacity-75">Connect with the community's most trusted manufacturers and parts suppliers through our resource guide.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="bg-zinc-900 border-zinc-800 h-100 p-3">
                                    <Card.Body>
                                        <h3 className="fs-5 fw-bold mb-3 text-info">Community Reviews</h3>
                                        <p className="small opacity-75">Integrated feedback and voting systems to find the best designs for your next build.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
};

export default Home;
