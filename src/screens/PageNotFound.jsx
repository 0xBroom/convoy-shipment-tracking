import NotFound from '../components/NotFound.jsx'
import { ROLE_HOME } from '../lib/roles.js'
import { useStore } from '../store/useStore.js'

// Any URL the route table does not know. The link goes to the role's home.
export default function PageNotFound() {
  const { state } = useStore()
  const customer = state.role === 'customer'
  return (
    <NotFound
      title="Page not found"
      message="That page does not exist."
      to={ROLE_HOME[state.role]}
      label={customer ? 'Back to my shipments' : 'Back to Today'}
    />
  )
}
