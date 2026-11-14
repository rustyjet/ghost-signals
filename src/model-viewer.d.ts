import type { ModelViewerElement } from '@google/model-viewer'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

// Lets JSX use <model-viewer> with any of its attributes (src, alt, camera-controls, ...).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> &
        Record<string, unknown>
    }
  }
}
