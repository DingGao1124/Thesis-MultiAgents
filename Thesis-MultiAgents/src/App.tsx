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

const MainPage = React.lazy(() => import("./pages/MainPage"))
const RobotAnimation = React.lazy(() => import("./pages/RobotAnimation"))
const KnowledgeGraph = React.lazy(() => import("./pages/KnowledgeGraph"))

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MainPage />}></Route>
      <Route path="/robotics" element={<RobotAnimation />} />
      <Route path="/kgraph" element={<KnowledgeGraph />} />
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
