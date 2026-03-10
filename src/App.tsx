import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Page Imports
import Admin from './pages/admin';
import Index from './pages/index';
import Submit from './pages/submit';
import Parts from './pages/parts/index';

// Resource Pages
import ResourcesIndex from './pages/resources/index';
import ResourceVendors from './pages/resources/vendors';
import ResourceSpreadsheets from './pages/resources/spreadsheets';
import ResourceRepositories from './pages/resources/repositories';
import ResourceWebsites from './pages/resources/websites';
import ResourceVideoGuides from './pages/resources/videoguides';
import ResourceWrittenGuides from './pages/resources/writtenguides';
import ResourceApplications from './pages/resources/applications';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Core Pages */}
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/:tab" element={<Admin />} />
                <Route path="/submit" element={<Submit />} />

                {/* Catalog & Tags */}
                <Route path="/parts" element={<Parts />} />
                <Route path="/parts/tags/:category" element={<Parts />} />
                <Route path="/tags/:category" element={<Parts />} />

                {/* Dynamic Brand/Platform Routes */}
                <Route path="/:brand" element={<Parts />} />
                <Route path="/:brand/models/:model" element={<Parts />} />
                <Route path="/brand/:brand" element={<Parts />} />
                <Route path="/brand/:brand/models/:model" element={<Parts />} />

                {/* Resource Routes */}
                <Route path="/resources" element={<ResourcesIndex />} />
                <Route path="/resources/vendors" element={<ResourceVendors />} />
                <Route path="/resources/spreadsheets" element={<ResourceSpreadsheets />} />
                <Route path="/resources/repositories" element={<ResourceRepositories />} />
                <Route path="/resources/websites" element={<ResourceWebsites />} />
                <Route path="/resources/videoguides" element={<ResourceVideoGuides />} />
                <Route path="/resources/writtenguides" element={<ResourceWrittenGuides />} />
                <Route path="/resources/applications" element={<ResourceApplications />} />

                {/* Catch-all legacy redirects or 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
