import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router"
import Main from "./pages/main"

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Main />} >
        {/* <Route index element={<Home />} />
        <Route path="threejs" element={<ThreeJS />} />
        <Route path="flow" element={<ReactFlow />} />
        <Route path="graph" element={<Graph />} />
        <Route path="test" element={<Test />} /> */}
      </Route>
    </>
  )
)

const App = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
