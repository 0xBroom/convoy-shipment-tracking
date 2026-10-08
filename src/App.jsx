import { createBrowserRouter, Navigate } from 'react-router'
import Shell from './components/Shell.jsx'
import RootRedirect from './screens/RootRedirect.jsx'
import PageNotFound from './screens/PageNotFound.jsx'
import Notifications from './screens/customer/Notifications.jsx'
import ShipmentDetail from './screens/customer/ShipmentDetail.jsx'
import ShipmentsList from './screens/customer/ShipmentsList.jsx'
import Exceptions from './screens/ops/Exceptions.jsx'
import OpsShipmentDetail from './screens/ops/OpsShipmentDetail.jsx'
import Portfolio from './screens/ops/Portfolio.jsx'
import Today from './screens/ops/Today.jsx'

// The route table. Search state lives in the URL: `/ops/shipments?q=` holds
// the natural-language search text and `/ops/exceptions?category=` the queue
// filter from the Today counts. Both are read by their screens.
export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <Shell />,
    children: [
      { path: 'customer', element: <Navigate to="/customer/shipments" replace /> },
      { path: 'customer/shipments', element: <ShipmentsList /> },
      { path: 'customer/shipments/:id', element: <ShipmentDetail /> },
      { path: 'customer/notifications', element: <Notifications /> },
      { path: 'ops', element: <Navigate to="/ops/today" replace /> },
      { path: 'ops/today', element: <Today /> },
      { path: 'ops/exceptions', element: <Exceptions /> },
      { path: 'ops/shipments', element: <Portfolio /> },
      { path: 'ops/shipments/:id', element: <OpsShipmentDetail /> },
      { path: '*', element: <PageNotFound /> },
    ],
  },
])
