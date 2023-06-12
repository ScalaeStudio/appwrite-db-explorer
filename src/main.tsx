import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import SetupToken from './SetupToken';
import ExplorerLayout from './ExplorerLayout';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: '/setup',
    element: <SetupToken />,
  },
  {
    path: '/',
    element: <ExplorerLayout />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <RouterProvider router={router} />
    <Toaster />
  </>
)
