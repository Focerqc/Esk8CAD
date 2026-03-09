exports.createPages = ({ actions }) => {
    const { createRedirect } = actions

    const redirects = [
        { from: "/boards", to: "/parts", permanent: true },
        { from: "/parts/tags", to: "/tags", permanent: true }
    ]

    // We can't easily do wildcard redirects in Gatsby's createRedirect without a plugin or specific logic,
    // but we can add common ones or handle it in a client-side layout if needed.
    // For now, let's add the basic ones.

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

exports.onCreatePage = ({ page, actions }) => {
    const { createPage } = actions

    // Handle Admin Tabs
    if (page.path.match(/^\/admin/)) {
        page.matchPath = "/admin/*"
        createPage(page)
    }

    // Handle Universal Tags Page
    if (page.path.match(/^\/tags/)) {
        page.matchPath = "/tags/*"
        createPage(page)
    }

    // Handle Universal Brand Page
    if (page.path.match(/^\/brand/)) {
        page.matchPath = "/brand/*"
        createPage(page)
    }

    // Handle Brand Model Pages (e.g., /mbs/models/...)
    // Only apply to top-level pages that are likely brand pages
    const corePages = ['/admin/', '/submit/', '/id/', '/oem/', '/resources/', '/fosterqc/', '/', '/404/', '/parts/', '/tags/'];
    if (!corePages.includes(page.path) && !page.path.startsWith('/resources/') && !page.path.startsWith('/tags/')) {
        page.matchPath = `${page.path}*`
        createPage(page)
    }
}
