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
                Made by ZiNc
            </Tooltip>
        }>
        <p className="floating-icon">
            Zn
        </p>
    </OverlayTrigger>
)
