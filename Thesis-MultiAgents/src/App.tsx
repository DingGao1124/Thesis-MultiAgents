import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router"
import MainPage from "./pages/MainPage"
import RobotAnimation from "./pages/RobotAnimation"

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MainPage />}></Route>
      <Route path="robotics" element={<RobotAnimation />}/>
    </>
  )
)

const App = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
