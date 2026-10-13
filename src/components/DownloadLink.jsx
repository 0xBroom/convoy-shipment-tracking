import { Download } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { documentFileName } from '../data/documents.js'
import { documentPdf } from '../lib/documentPdf.js'

// A real download: the PDF is built in the browser when the row mounts and
// offered through a Blob URL, so the link behaves like any file link (click,
// keyboard, "save as"). The URL is set on the anchor directly, since React
// never owns the href here, and released when the row goes away.
export default function DownloadLink({ view, doc }) {
  const anchor = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(documentPdf(view, doc))
    const node = anchor.current
    node.href = url
    return () => {
      URL.revokeObjectURL(url)
      node.removeAttribute('href')
    }
  }, [view, doc])

  const name = documentFileName(doc.type, view.id)
  return (
    <a className="button button-quiet docs-download" ref={anchor} download={name}>
      <Download size={14} aria-hidden="true" />
      Download
      <span className="visually-hidden">, {name}</span>
    </a>
  )
}
