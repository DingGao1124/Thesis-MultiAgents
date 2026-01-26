import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router"
import MainPage from "./pages/MainPage"
import RobotAnimation from "./pages/RobotAnimation"
import KnowledgeGraph from './pages/KnowledgeGraph'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MainPage />}></Route>
      <Route path="robotics" element={<RobotAnimation />} />
      <Route path="kgraph" element={<KnowledgeGraph />} />
    </>
  )
)

const App = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
