import React, { Suspense } from "react"
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router"
import { ErrorBoundary } from 'react-error-boundary'
import Loading from "./components/layout/Loading"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"

import MainPage from "./pages/MainPage"
import GamePage from "./pages/GamePage/GamePage"
import TestPage from "./pages/TestPage"

const RobotAnimation = React.lazy(() => import("./pages/RobotAnimation"))
const KnowledgeGraph = React.lazy(() => import("./pages/KnowledgeGraph"))

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MainPage />}></Route>
      <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
      <Route path="/multi-agents" element={<KnowledgeGraph />} />
      <Route path="/production-line" element={<KnowledgeGraph />} />
      <Route path="/robotics" element={<RobotAnimation />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
)

const App = () => {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
