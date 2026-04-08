import React, { Suspense } from "react"
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router"
import { ErrorBoundary } from "react-error-boundary"

import Loading from "./components/layout/Loading"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"
import HomePage from "./pages/Home"
import GamePage from "./pages/GamePage/GamePage"
import TestPage from "./pages/TestPage"

const KnowledgeGraph = React.lazy(() => import("./pages/KnowledgeGraph"))
const ProductionLine = React.lazy(() => import("./pages/ProductionLine"))
const MultiAgents = React.lazy(() => import("./pages/Multi-Agents"))
const ModelAssetsPage = React.lazy(() => import("./pages/ModelAssets"))

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
      <Route path="/production-line" element={<ProductionLine />} />
      <Route path="/multi-agents" element={<MultiAgents />} />
      <Route path="/model-assets" element={<ModelAssetsPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
)

export default function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  )
}
