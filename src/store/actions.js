// Action creators: plain objects only. The reducer owns every state change.

export const switchRole = (role) => ({ type: 'switchRole', role })

export const sendNotice = ({ shipmentId, kind = 'delay', text }) => ({
  type: 'sendNotice',
  shipmentId,
  kind,
  text,
})

export const requestDocument = ({ shipmentId, docType, text }) => ({
  type: 'requestDocument',
  shipmentId,
  docType,
  text,
})

export const contactOperator = ({ shipmentId, operatorId, text }) => ({
  type: 'contactOperator',
  shipmentId,
  operatorId,
  text,
})

// The one scripted live event (src/data/liveEvent.js). Applies once per session.
export const applyLiveEvent = () => ({ type: 'applyLiveEvent' })

export const markNoticesRead = (ids) => ({ type: 'markNoticesRead', ids })

export const dismissNotice = (id) => ({ type: 'dismissNotice', id })

export const dismissToast = (id) => ({ type: 'dismissToast', id })

export const resetDemo = () => ({ type: 'resetDemo' })
