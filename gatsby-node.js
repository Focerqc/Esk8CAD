exports.createPages = ({ actions }) => {
    const { createRedirect } = actions

    const redirects = [
        { from: "/boards", to: "/parts", permanent: true }
    ]

    for (const thisRedirect of redirects) {
        createRedirect({
            fromPath: thisRedirect.from,
            toPath: thisRedirect.to,
            isPermanent: thisRedirect.permanent,
            force: true,
            redirectInBrowser: true
        })
    }
}
