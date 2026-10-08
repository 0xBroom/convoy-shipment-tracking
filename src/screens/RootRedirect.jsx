import { Navigate } from 'react-router'
import { ROLE_HOME } from '../lib/roles.js'
import { useStore } from '../store/useStore.js'

// "/" sends each role to its home.
export default function RootRedirect() {
  const { state } = useStore()
  return <Navigate to={ROLE_HOME[state.role]} replace />
}
