import "./App.css";
import { createBrowserRouter, redirect, RouterProvider } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Login from "./views/Login";
import Compose from "./views/Compose";
import Home from "./views/Home";

const routeConfig = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/compose",
                element: <Compose />
            }
        ]
    },
    {
        path: "/login",
        element: <Login />
    }
]);

function App() {

    return (
        <>
            <RouterProvider router={routeConfig}/>
        </>
    );
}

export default App;
