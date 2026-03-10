import React from "react"
import { Card, Col } from "react-bootstrap"

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/cards | React-Bootstrap Card}
 * with copyright information
 */
export default () => (
    <Col
        xs={{ span: 12 }}
        md={{ span: 12 }}
        lg={{ span: 12 }}
        key={`item-card-copyright`}>
        <div className="flex-center flex-top">
            <Card className="full-width">
                <Card.Body>
                    <Card.Text>
                        All images are copyright to their respective owners.
                        <br />However, if you own an image, brand or logo and would like it to be removed please contact us at: <span className="text-info fw-bold">Text@email.com</span>
                    </Card.Text>
                </Card.Body>
            </Card>
        </div>
    </Col>
)
