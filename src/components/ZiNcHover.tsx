import React from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"

/**
 * Creates a floating icon
 */
export default () => (
    <OverlayTrigger
        key={"zinc-hover"}
        placement="left"
        overlay={
            <Tooltip>
                Esk8CAD / Quinn
            </Tooltip>
        }>
        <p className="floating-icon">
            EQ
        </p>
    </OverlayTrigger>
)
