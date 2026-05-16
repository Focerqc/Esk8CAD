import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

// Lazy Page Imports
const Admin = lazy(() => import('./pages/admin'));
const Index = lazy(() => import('./pages/index'));
const Submit = lazy(() => import('./pages/submit'));
const Parts = lazy(() => import('./pages/parts/index'));
const Fosterqc = lazy(() => import('./pages/fosterqc'));

// Resource Pages (Lazy)
const ResourcesIndex = lazy(() => import('./pages/resources/index'));
const ResourceVendors = lazy(() => import('./pages/resources/vendors'));
const ResourceSpreadsheets = lazy(() => import('./pages/resources/spreadsheets'));
const ResourceRepositories = lazy(() => import('./pages/resources/repositories'));
const ResourceWebsites = lazy(() => import('./pages/resources/websites'));
const ResourceVideoGuides = lazy(() => import('./pages/resources/videoguides'));
const ResourceWrittenGuides = lazy(() => import('./pages/resources/writtenguides'));
const ResourceApplications = lazy(() => import('./pages/resources/applications'));

import ErrorBoundary from './components/ErrorBoundary';

const PageLoader = () => (
    <div className="d-flex justify-content-center align-items-center bg-black min-vh-100">
        <Spinner animation="border" variant="info" />
    </div>
);

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Core Pages */}
                        <Route path="/" element={<Index />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/:tab" element={<Admin />} />
                        <Route path="/submit" element={<Submit />} />
                        <Route path="/fosterqc" element={<Fosterqc />} />

                        {/* Catalog & Tags */}
                        <Route path="/parts" element={<Parts />} />
                        <Route path="/oem" element={<Parts />} />
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
                </Suspense>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
