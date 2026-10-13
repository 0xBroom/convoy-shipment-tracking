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

// `attachments` lists the file names that went with the document.
export const sendDocument = ({ shipmentId, docType, operatorId, text, attachments = [] }) => ({
  type: 'sendDocument',
  shipmentId,
  docType,
  operatorId,
  text,
  attachments,
})

export const contactOperator = ({ shipmentId, operatorId, text }) => ({
  type: 'contactOperator',
  shipmentId,
  operatorId,
  text,
})

// The scripted live feed (src/data/liveFeed.js). The ticker in
// src/store/liveFeed.js dispatches applyFeedEvent while the feed plays.
export const playFeed = () => ({ type: 'playFeed' })

export const pauseFeed = () => ({ type: 'pauseFeed' })

export const applyFeedEvent = () => ({ type: 'applyFeedEvent' })

export const markNoticesRead = (ids) => ({ type: 'markNoticesRead', ids })

export const dismissNotice = (id) => ({ type: 'dismissNotice', id })

export const dismissToast = (id) => ({ type: 'dismissToast', id })

export const resetDemo = () => ({ type: 'resetDemo' })
