/**
 * model-viewer (and the three.js inside it) is most of a chapter's code, so it loads in its own file after
 * the words and photos. The <model-viewer> elements render as soon as it arrives; Lit keeps any property
 * set on them before that (camera orbit, target) and applies it on upgrade.
 */
let loading: Promise<unknown> | null = null
export const loadModelViewer = () => (loading ??= import('@google/model-viewer'))
