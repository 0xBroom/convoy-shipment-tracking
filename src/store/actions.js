// Action creators: plain objects only. The reducer owns every state change.

export const switchRole = (role) => ({ type: 'switchRole', role })

export const sendNotice = ({ shipmentId, kind = 'delay', text }) => ({
  type: 'sendNotice',
  shipmentId,
  kind,
  text,
})

// Document actions name the operator the message goes to (`operatorId`).
export const requestDocument = ({ shipmentId, docType, operatorId, text }) => ({
  type: 'requestDocument',
  shipmentId,
  docType,
  operatorId,
  text,
})

export const sendDocument = ({ shipmentId, docType, operatorId, text }) => ({
  type: 'sendDocument',
  shipmentId,
  docType,
  operatorId,
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
