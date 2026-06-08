(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime/runtime-types.d.ts" />
/// <reference path="../../../shared/runtime/dev-globals.d.ts" />
/// <reference path="../../../shared/runtime/dev-protocol.d.ts" />
/// <reference path="../../../shared/runtime/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateB.type === 'total') {
        // A total update replaces the entire chunk, so it supersedes any prior update.
        return updateB;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/src/components/HeroSection.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-components/dist/styled-components.browser.esm.js [client] (ecmascript)");
;
;
const HeroContainer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].div.withConfig({
    displayName: "HeroSection__HeroContainer",
    componentId: "sc-aa49db27-0"
})`
  background: var(--black);
  padding: 120px 20px;
  text-align: center;
  border-bottom: 5px solid var(--orange);

  @media (max-width: 768px) {
    padding: 80px 20px; /* Reduz o espaçamento vertical */
  }
`;
_c = HeroContainer;
const Title = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].h1.withConfig({
    displayName: "HeroSection__Title",
    componentId: "sc-aa49db27-1"
})`
  font-size: 3.8rem;
  font-weight: 900;
  margin-bottom: 1rem;
  color: var(--white);

  @media (max-width: 768px) {
    font-size: 2.5rem; /* Reduz o tamanho da fonte */
  }
`;
_c1 = Title;
const Subtitle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].p.withConfig({
    displayName: "HeroSection__Subtitle",
    componentId: "sc-aa49db27-2"
})`
  font-size: 1.3rem;
  max-width: 750px;
  margin: 0 auto;
  color: var(--light-grey);
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.1rem; /* Reduz o tamanho da fonte */
  }
`;
_c2 = Subtitle;
function HeroSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HeroContainer, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Title, {
                children: "A Essência do Jogo em Análise"
            }, void 0, false, {
                fileName: "[project]/src/components/HeroSection.js",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Subtitle, {
                children: [
                    "Olá, eu sou Marcos Lobo. Analista de futebol apaixonado por traduzir o que acontece em campo em análises táticas e de desempenho. As ideias deste blog nascem da observação prática do jogo, uma abordagem que aprimorei como analista principal no projeto ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Improváveis do Cartola"
                    }, void 0, false, {
                        fileName: "[project]/src/components/HeroSection.js",
                        lineNumber: 43,
                        columnNumber: 131
                    }, this),
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/HeroSection.js",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/HeroSection.js",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_c3 = HeroSection;
const __TURBOPACK__default__export__ = HeroSection;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "HeroContainer");
__turbopack_context__.k.register(_c1, "Title");
__turbopack_context__.k.register(_c2, "Subtitle");
__turbopack_context__.k.register(_c3, "HeroSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/PostCard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-components/dist/styled-components.browser.esm.js [client] (ecmascript)");
;
;
;
const Card = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].div.withConfig({
    displayName: "PostCard__Card",
    componentId: "sc-e7a6c9ec-0"
})`
  background: var(--dark-grey);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  }

  &:hover .post-cover {
    transform: scale(1.05);
  }
`;
_c = Card;
const CoverContainer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].div.withConfig({
    displayName: "PostCard__CoverContainer",
    componentId: "sc-e7a6c9ec-1"
})`
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
  background: #000;
`;
_c1 = CoverContainer;
const CoverImage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].img.withConfig({
    displayName: "PostCard__CoverImage",
    componentId: "sc-e7a6c9ec-2"
})`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-in-out;
  opacity: 0.9;
`;
_c2 = CoverImage;
const CardContent = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].div.withConfig({
    displayName: "PostCard__CardContent",
    componentId: "sc-e7a6c9ec-3"
})`
  padding: 25px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;
_c3 = CardContent;
const Category = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].span.withConfig({
    displayName: "PostCard__Category",
    componentId: "sc-e7a6c9ec-4"
})`
  background-color: var(--orange);
  color: var(--black);
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  margin-bottom: 15px;
  align-self: flex-start;
`;
_c4 = Category;
const PostTitle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].h3.withConfig({
    displayName: "PostCard__PostTitle",
    componentId: "sc-e7a6c9ec-5"
})`
  color: var(--white);
  margin-bottom: 10px;
  font-size: 1.4rem;
  line-height: 1.3;
`;
_c5 = PostTitle;
const PostSubtitle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].p.withConfig({
    displayName: "PostCard__PostSubtitle",
    componentId: "sc-e7a6c9ec-6"
})`
  color: var(--light-grey);
  font-size: 0.95rem;
  line-height: 1.5;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 20px;
`;
_c6 = PostSubtitle;
const ReadMoreLink = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]).withConfig({
    displayName: "PostCard__ReadMoreLink",
    componentId: "sc-e7a6c9ec-7"
})`
  color: var(--orange);
  font-weight: bold;
  display: inline-block;
  margin-top: auto;
`;
_c7 = ReadMoreLink;
function PostCard({ title, category, slug, flagCode, subtitle, coverImage }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
        children: [
            coverImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CoverContainer, {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CoverImage, {
                    src: coverImage,
                    alt: title,
                    className: "post-cover",
                    loading: "lazy"
                }, void 0, false, {
                    fileName: "[project]/src/components/PostCard.js",
                    lineNumber: 88,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/PostCard.js",
                lineNumber: 87,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CardContent, {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Category, {
                        children: category
                    }, void 0, false, {
                        fileName: "[project]/src/components/PostCard.js",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PostTitle, {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                        },
                        children: [
                            title,
                            flagCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: `https://flagcdn.com/w40/${flagCode}.png`,
                                alt: "Bandeira",
                                loading: "lazy",
                                style: {
                                    height: '18px',
                                    borderRadius: '2px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                    display: 'inline-block'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/PostCard.js",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/PostCard.js",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PostSubtitle, {
                        children: subtitle
                    }, void 0, false, {
                        fileName: "[project]/src/components/PostCard.js",
                        lineNumber: 109,
                        columnNumber: 22
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReadMoreLink, {
                        href: `/post/${slug}`,
                        children: "Ler Análise Completa →"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PostCard.js",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PostCard.js",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/PostCard.js",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
_c8 = PostCard;
const __TURBOPACK__default__export__ = PostCard;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
__turbopack_context__.k.register(_c, "Card");
__turbopack_context__.k.register(_c1, "CoverContainer");
__turbopack_context__.k.register(_c2, "CoverImage");
__turbopack_context__.k.register(_c3, "CardContent");
__turbopack_context__.k.register(_c4, "Category");
__turbopack_context__.k.register(_c5, "PostTitle");
__turbopack_context__.k.register(_c6, "PostSubtitle");
__turbopack_context__.k.register(_c7, "ReadMoreLink");
__turbopack_context__.k.register(_c8, "PostCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/flags.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "flags",
    ()=>flags
]);
const flags = {
    // Anfitriões
    canada: '<img loading="lazy" src="https://flagcdn.com/w20/ca.png" alt="🇨🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    estadosUnidos: '<img loading="lazy" src="https://flagcdn.com/w20/us.png" alt="🇺🇸" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    mexico: '<img loading="lazy" src="https://flagcdn.com/w20/mx.png" alt="🇲🇽" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // AFC (Ásia)
    arabiaSaudita: '<img loading="lazy" src="https://flagcdn.com/w20/sa.png" alt="🇸🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    australia: '<img loading="lazy" src="https://flagcdn.com/w20/au.png" alt="🇦🇺" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    catar: '<img loading="lazy" src="https://flagcdn.com/w20/qa.png" alt="🇶🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    coreiaDoSul: '<img loading="lazy" src="https://flagcdn.com/w20/kr.png" alt="🇰🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    ira: '<img loading="lazy" src="https://flagcdn.com/w20/ir.png" alt="🇮🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    iraque: '<img loading="lazy" src="https://flagcdn.com/w20/iq.png" alt="🇮🇶" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    japao: '<img loading="lazy" src="https://flagcdn.com/w20/jp.png" alt="🇯🇵" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    jordania: '<img loading="lazy" src="https://flagcdn.com/w20/jo.png" alt="🇯🇴" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    uzbequistao: '<img loading="lazy" src="https://flagcdn.com/w20/uz.png" alt="🇺🇿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // CAF (África)
    africaDoSul: '<img loading="lazy" src="https://flagcdn.com/w20/za.png" alt="🇿🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    argelia: '<img loading="lazy" src="https://flagcdn.com/w20/dz.png" alt="🇩🇿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    caboVerde: '<img loading="lazy" src="https://flagcdn.com/w20/cv.png" alt="🇨🇻" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    costaDoMarfim: '<img loading="lazy" src="https://flagcdn.com/w20/ci.png" alt="🇨🇮" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    egito: '<img loading="lazy" src="https://flagcdn.com/w20/eg.png" alt="🇪🇬" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    gana: '<img loading="lazy" src="https://flagcdn.com/w20/gh.png" alt="🇬🇭" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    marrocos: '<img loading="lazy" src="https://flagcdn.com/w20/ma.png" alt="🇲🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    rdCongo: '<img loading="lazy" src="https://flagcdn.com/w20/cd.png" alt="🇨🇩" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    senegal: '<img loading="lazy" src="https://flagcdn.com/w20/sn.png" alt="🇸🇳" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    tunisia: '<img loading="lazy" src="https://flagcdn.com/w20/tn.png" alt="🇹🇳" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // CONMEBOL (América do Sul)
    argentina: '<img loading="lazy" src="https://flagcdn.com/w20/ar.png" alt="🇦🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    brasil: '<img loading="lazy" src="https://flagcdn.com/w20/br.png" alt="🇧🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    colombia: '<img loading="lazy" src="https://flagcdn.com/w20/co.png" alt="🇨🇴" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    equador: '<img loading="lazy" src="https://flagcdn.com/w20/ec.png" alt="🇪🇨" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    paraguai: '<img loading="lazy" src="https://flagcdn.com/w20/py.png" alt="🇵🇾" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    uruguai: '<img loading="lazy" src="https://flagcdn.com/w20/uy.png" alt="🇺🇾" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // OFC (Oceania)
    novaZelandia: '<img loading="lazy" src="https://flagcdn.com/w20/nz.png" alt="🇳🇿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // UEFA (Europa)
    alemanha: '<img loading="lazy" src="https://flagcdn.com/w20/de.png" alt="🇩🇪" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    austria: '<img loading="lazy" src="https://flagcdn.com/w20/at.png" alt="🇦🇹" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    belgica: '<img loading="lazy" src="https://flagcdn.com/w20/be.png" alt="🇧🇪" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    bosniaEHerzegovina: '<img loading="lazy" src="https://flagcdn.com/w20/ba.png" alt="🇧🇦" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    croacia: '<img loading="lazy" src="https://flagcdn.com/w20/hr.png" alt="🇭🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    escocia: '<img loading="lazy" src="https://flagcdn.com/w20/gb-sct.png" alt="🏴󠁧󠁢󠁳󠁣󠁴󠁿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    espanha: '<img loading="lazy" src="https://flagcdn.com/w20/es.png" alt="🇪🇸" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    franca: '<img loading="lazy" src="https://flagcdn.com/w20/fr.png" alt="🇫🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    holanda: '<img loading="lazy" src="https://flagcdn.com/w20/nl.png" alt="🇳🇱" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    inglaterra: '<img loading="lazy" src="https://flagcdn.com/w20/gb-eng.png" alt="🏴󠁧󠁢󠁥󠁮󠁧󠁿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    noruega: '<img loading="lazy" src="https://flagcdn.com/w20/no.png" alt="🇳🇴" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    portugal: '<img loading="lazy" src="https://flagcdn.com/w20/pt.png" alt="🇵🇹" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    republicaTcheca: '<img loading="lazy" src="https://flagcdn.com/w20/cz.png" alt="🇨🇿" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    suecia: '<img loading="lazy" src="https://flagcdn.com/w20/se.png" alt="🇸🇪" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    suica: '<img loading="lazy" src="https://flagcdn.com/w20/ch.png" alt="🇨🇭" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    turquia: '<img loading="lazy" src="https://flagcdn.com/w20/tr.png" alt="🇹🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    dinamarca: '<img loading="lazy" src="https://flagcdn.com/w20/dk.png" alt="🇩🇰" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    grecia: '<img loading="lazy" src="https://flagcdn.com/w20/gr.png" alt="🇬🇷" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // Concacaf (Américas do Norte/Central e Caribe - excluindo anfitriões já listados)
    curacau: '<img loading="lazy" src="https://flagcdn.com/w20/cw.png" alt="🇨🇼" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    haiti: '<img loading="lazy" src="https://flagcdn.com/w20/ht.png" alt="🇭🇹" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    // Outros
    sanMarino: '<img loading="lazy" src="https://flagcdn.com/w20/sm.png" alt="🇸🇲" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    italia: '<img loading="lazy" src="https://flagcdn.com/w20/it.png" alt="🇮🇹" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">',
    moldavia: '<img loading="lazy" src="https://flagcdn.com/w20/md.png" alt="🇲🇩" style="vertical-align: middle; height: 14px; margin-bottom: 2px; border-radius: 2px;">'
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/copa2026/paises/noruega.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "noruegaPost",
    ()=>noruegaPost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/flags.js [client] (ecmascript)");
;
const noruegaPost = {
    slug: 'copa-2026-noruega-analise',
    title: 'COPA 2026: NORUEGA',
    flagCode: 'no',
    subtitle: 'Os vikings buscam seu espaço na elite do futebol 🏆',
    category: 'Copa 2026',
    date: '4 de Junho de 2026',
    author: 'Marcos Lobo',
    isWorldCup: true,
    coverImage: '/copa2026/noruega/noruega.jpg',
    content: `

    <p align="center">
        <img loading="lazy" src="/copa2026/noruega/noruega.jpg" alt="Noruega" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
    <p>A seleção europeia comandada por sua estrela Haaland, chega como sensação na Copa do Mundo após 28 anos fora dos mundiais. 🔙</p>
    <p>Os "Løvene", como são conhecidos, chegam ao mundial tendo o melhor ataque das eliminatórias com incríveis 37 gols marcados em 8 jogos disputados, dando uma média impressionante na casa de 4,62 por jogo. ☄️</p>

    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffd700;">
      <h3 style="margin-top: 0; color: #ffd700; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">📈 ESTATÍSTICAS GERAIS</h3>
      <ul style="list-style-type: none; padding-left: 0; margin: 15px 0 0 0;">
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>🏃 Jogos</span>
          <strong>8</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>✅ Vitórias</span>
          <strong>8</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>⚽ Gols Marcados (GM)</span>
          <strong>37 (Média: 4.62)</strong>
        </li>
        <li style="margin-bottom: 0; display: flex; justify-content: space-between; padding-bottom: 4px;">
          <span>🛡️ Gols Sofridos (GS)</span>
          <strong>5</strong>
        </li>
      </ul>
    </div>

    <p>Mesmo em um grupo que contava com a Itália ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].italia}, a Noruega não tomou conhecimento: aplicou duas vitórias indiscutíveis. Uma por 3-0 em Oslo e outra em pleno San Siro por 1-4! ✨</p>
    <p>A seleção nórdica também contou com a maior goleada das eliminatórias ao aplicar um sonoro 11-1 diante da Moldávia! ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].moldavia}</p>

    <h2 style="margin-top: 40px; color: #ffd700; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">⭐ PRINCIPAIS ESTRELAS ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}</h2>
    <p>Abaixo, detalhamos os principais nomes da seleção e também atletas promissores que podem surpreender na competição. ✍🏻</p>

    <!-- RYERSON -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        RYERSON ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/noruega/jogadores/ryerson.jpg" alt="Ryerson" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O lateral que atua no Borussia Dortmund chega para surpreender no mundial e se apresenta como uma peça muito atrativa para a 1ª rodada.</p>
      <p>Ele foi um dos principais assistentes da temporada europeia, acumulando 15 🅰️ para gols no Campeonato Alemão. Nas eliminatórias, em 8 jogos, somou 4 🅰️.</p>
      <p>Um jogador com excelente capacidade de cruzamentos e forte presença na área, que sempre busca servir os atacantes melhor posicionados para finalizar.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 8,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- ODEGAARD -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        ODEGAARD ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/noruega/jogadores/odegaard.jpg" alt="Odegaard" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O camisa 10 e capitão da seleção é a referência técnica absoluta no meio-campo, ditando o ritmo de jogo do time.</p>
      <p>Apesar de uma temporada na qual sofreu com algumas lesões, chega com potencial total de ser a peça mais decisiva da criação.</p>
      <p>Sua temporada pelo Arsenal somou 16 jogos como titular, onde anotou 1 ⚽ e distribuiu 6 🅰️. Nas eliminatórias, atuou em 5 partidas e obteve 1 ⚽ e 7 🅰️! Foi um dos grandes destaques de criação na Europa, sendo líder europeu em passes decisivos por jogo, com média de 5.40 por partida.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 13,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- HAALAND -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        HAALAND ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/noruega/jogadores/haaland.jpg" alt="Haaland" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>A estrela mundial é a maior esperança da seleção. O artilheiro dispensa comentários sobre sua absurda capacidade técnica de decisão na área.</p>
      <p>Em uma temporada mágica individualmente, foi o artilheiro da Premier League com 27 ⚽ e 8 🅰️ em 34 jogos como titular.</p>
      <p>Pela seleção, foi titular em todos os 8 jogos das eliminatórias e contribuiu com incríveis 16 ⚽ e 2 🅰️. Sua média de participações diretas em gols ficou em impressionantes 2,25 por jogo! Um autêntico cometa. ☄️</p>
      <p>É uma peça unânime para escalar na primeira rodada diante do Iraque. Tem tudo para fazer uma excelente estreia e liderar a Noruega rumo à vitória! Decisivo.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 24,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- ANTONIO NUSA -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        ANTONIO NUSA ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/noruega/jogadores/nusa.jpg" alt="Antonio Nusa" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O garoto de apenas 21 anos chega como um dos principais candidatos a revelar-se uma grande surpresa positiva em sua seleção.</p>
      <p>Atuando pelo Leipzig na Alemanha, somou 24 partidas anotando 4 ⚽ e distribuindo 3 🅰️. Ele se destaca como um ponta extremamente criativo, acumulando média de 1.2 passes decisivos e criando 9 grandes chances no período. 🧙🏻</p>
      <p>Nas eliminatórias foi titular em 6 dos 8 jogos e respondeu com 2 ⚽ e 3 🅰️, gerando 7 grandes chances e terminando com 2.3 passes decisivos por partida. Trata-se do grande diferencial da equipe para fugir do radar dos nomes mais visados!</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 7,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <p style="margin-top: 30px; font-weight: 500; font-size: 1.15rem; line-height: 1.8;">
      Acredito que vale muito a pena investir nas peças norueguesas na 1ª rodada, pois farão o confronto contra o adversário teoricamente mais acessível do grupo — que também conta com as fortíssimas seleções de França ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].franca} e Senegal ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].senegal}. Um resultado positivo convincente é essencial diante do Iraque ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].iraque}, e a construção de saldo de gols pode vir a ser o grande diferencial de classificação! Olho neles. ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].noruega}
    </p>
  `
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/copa2026/paises/austria.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "austriaPost",
    ()=>austriaPost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/flags.js [client] (ecmascript)");
;
const austriaPost = {
    slug: 'copa-2026-austria-analise',
    title: 'COPA 2026: ÁUSTRIA',
    flagCode: 'at',
    subtitle: '"O retorno triunfal e a promessa do talento austríaco 🏆',
    category: 'Copa do Mundo 2026',
    date: '5 de junho de 2026',
    author: 'Marcos Lobo',
    isWorldCup: true,
    coverImage: '/copa2026/austria/austria.jpg',
    content: `

    <p align="center">
        <img loading="lazy" src="/copa2026/austria/austria.jpg" alt="Austria" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
    <p>A seleção europeia chega ao mundial de 2026 nos holofotes como sensação após 6 edições de ausência, uma geração que vem dando bons frutos.</p>
    <p>Eles fizeram uma campanha sólida nas eliminatórias europeias e se sagraram líderes de seu grupo com 19 pontos de 24 possíveis. ☑️</p>

    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffd700;">
      <h3 style="margin-top: 0; color: #ffd700; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">ESTATÍSTICAS GERAIS 📈</h3>
      <ul style="list-style-type: none; padding-left: 0; margin: 15px 0 0 0;">
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>🏃 Jogos</span>
          <strong>8</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>✅ Vitórias</span>
          <strong>6</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>⚽ Gols Marcados (GM)</span>
          <strong>22</strong>
        </li>
        <li style="margin-bottom: 0; display: flex; justify-content: space-between; padding-bottom: 4px;">
          <span>🛡️ Gols Sofridos (GS)</span>
          <strong>4</strong>
        </li>
      </ul>
    </div>

    <p>Em um grupo acessível conseguiram a classificação direta para a competição... seu principal destaque foi uma incrível goleada de 10-0 pra cima da seleção de San Marino! ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].sanMarino}</p>

    <h2 style="margin-top: 40px; color: #ffd700; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">⭐ PRINCIPAIS ESTRELAS ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria}</h2>
    <p>Abaixo, detalhamos os principais nomes da seleção e também atletas promissores que podem surpreender na competição. ✍🏻</p>

    <!-- POSCH -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        POSCH ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/austria/jogadores/posch.jpg" alt="Posch" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>Acredito que o defensor pode ser uma grata surpresa na estreia, ele atua como LAT mas já foi utilizado em linhas de 3 como ZAG. Destaco sua capacidade de desenvolver jogadas e suas criações... </p>
      <p>Atuou por 7 partidas nas eliminatórias sendo titular em 4 delas, garantiu  2⚽ e 2🅰️. Muito se fala do seu companheiro, Laimer... mas olharia com muita atenção para ele caso surja como titular.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 4,00</span>
        <span><strong>⏹️ STATUS:</strong> Nulo </span>
      </div>
    </div>

    <!-- SABITZER -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        SABITZER ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/austria/jogadores/sabitzer.jpg" alt="Sabitzer" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O meia é referência do elenco e peça fundamental no esquema de Ralf Rangnick, responsável pela braçadeira de capitão e por algumas bolas paradas.</p>
      <p>Pelo Borussia Dortmund na temporada foi titular em 21 jogos e contou com 1⚽ e 2🅰️. </p>
      <p>Nas eliminatórias, foi titular em todas as 8 partidas fechando com 3⚽ e 3🅰️! Teve excelentes números de finalizações com médias na casa dos 3.00 sendo 2.00 no alvo. 🎯</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 10,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- ARNAUTOVIC -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        ARNAUTOVIC ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/austria/jogadores/arnautovic.jpg" alt="Arnautovic" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O homem gol da seleção chega como forte candidato a mito do time, soma experiência em ligas de primeiro escalão no futebol europeu com refino técnico nas decisões.</p>
      <p>Na temporada atuou por 14 jogos como titular no Estrela Vermelha onde fechou com 7⚽ e 8🅰️.</p>
      <p>Já por sua seleção nas eliminatórias foi titular em 5 partidas e garantiu 8⚽ e 1🅰️! </p>
      <p>Ponto bem positivo é o seu poder de criação, cotado como um "CA", teve boas médias de 1.7 passes decisivos por partida, gerando também 10 grandes chances com ambas as camisas.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 8,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- PAUL WANNER -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        PAUL WANNER ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/austria/jogadores/wanner.jpg" alt="Paul Wanner" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>A joia de 20 anos chega para o mundial repleta de expectativas. Filho de pai alemão, mas com mãe austríaca, decidiu defender as cores da sua terra natal.</p>
      <p>Chegou ao PSV após ser negociado junto ao Bayern de Munique, somou 19 jogos como titular contando com 3⚽ e 3🅰️!</p>
      <p>Ele não teve participação nas eliminatórias, mas é cotado a ser titular na vaga do lesionado Christoph Baumgartner. O canhoto clássico de 186cm com bastante refino técnico é visto como um futuro líder técnico desta seleção! Olho nele. 🧙🏻</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 5,00</span>
        <span><strong>⏹️ STATUS:</strong> Nulo</span>
      </div>
    </div>

    <p style="margin-top: 30px; font-weight: 500; font-size: 1.15rem; line-height: 1.8;">
      Assim como falei anteriormente sobre enfrentar o elo mais fraco do grupo, o mesmo acontece com Áustria ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].austria} que tem pela frente a seleção da Jordânia ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].jordania} em grupo que conta ainda com  Argentina ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].argentina} e Argélia ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].argelia}! Somar gols, saldo e pontos é fundamental em busca de uma vaga na próxima fase. 🔜
    </p>
  `
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/copa2026/paises/escocia.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "escociaPost",
    ()=>escociaPost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/flags.js [client] (ecmascript)");
;
const escociaPost = {
    slug: 'copa-2026-escocia-analise',
    title: 'COPA 2026: ESCÓCIA',
    flagCode: 'gb-sct',
    subtitle: 'A reinvenção e a promessa de uma geração de ouro 🏆',
    category: 'Copa do Mundo 2026',
    date: '08 de junho de 2026',
    author: 'Marcos Lobo',
    isWorldCup: true,
    coverImage: '/copa2026/escocia/escocia.jpg',
    content: `

    <p align="center">
        <img loading="lazy" src="/copa2026/escocia/escocia.jpg" alt="Escocia" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
    <p>O Tartan Army assim como as seleções já analisadas chegam ao mundial após 28 anos de ausência, um relato de certa forma interessante é que na sua última participação em Copas do Mundo em 1998 também esteve no grupo do Brasil assim como em 2026.</p>
    <p>Em um grupo nas eliminatórias com as seleções da Dinamarca ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].dinamarca} e Grécia ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].grecia} teve uma campanha sólida e a primeira colocação garantida. ☑️</p>

    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffd700;">
      <h3 style="margin-top: 0; color: #ffd700; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">ESTATÍSTICAS GERAIS 📈</h3>
      <ul style="list-style-type: none; padding-left: 0; margin: 15px 0 0 0;">
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>🏃 Jogos</span>
          <strong>6</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>✅ Vitórias</span>
          <strong>4</strong>
        </li>
        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <span>⚽ Gols Marcados (GM)</span>
          <strong>13</strong>
        </li>
        <li style="margin-bottom: 0; display: flex; justify-content: space-between; padding-bottom: 4px;">
          <span>🛡️ Gols Sofridos (GS)</span>
          <strong>7</strong>
        </li>
      </ul>
    </div>

    <p>Em um grupo que não era cotada como a "favorita" conseguiu um feito e tanto, pra fechar bem a campanha aplicou um 4-2 na Dinamarca ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].dinamarca} em Glasgow o que lhe rendeu a liderança e a classificação direta ao mundial. 🗺️</p>
    <h2 style="margin-top: 40px; color: #ffd700; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">PRINCIPAIS ESTRELAS ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].escocia}⭐</h2>
    <p>Irei citar abaixo os principais nomes da seleção e também nomes que podem surpreender</p>

    <!-- ROBERTSON -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        ROBERTSON ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].escocia}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/escocia/jogadores/robertson.jpg" alt="Robertson" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O veterano lateral-esquerdo chega para sua primeira copa do mundo após carreira brilhante no Liverpool, ele é o capitão da equipe.</p>
      <p>De saída do time inglês somou apenas 11 partidas como titular e contou com 1⚽, nas eliminatórias atuou em todas as 6 partidas e fechou com 2🅰️. Suas médias defensivas são válidas, somou 1.2 desarmes🛡️ e 1.0 interceptações🛡️.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 9,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- MCTOMINAY -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        SCOTT MCTOMINAY ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].escocia}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/escocia/jogadores/mctominay.jpg" alt="Mctominay" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>A grande estrela e principal peça da seleção chega em seu auge técnico após bela temporada no futebol italiano. </p>
      <p>Nas eliminatórias, foi titular em todas as 8 partidas fechando com 3⚽ e 3🅰️! </p>
      <p> Teve excelentes números de finalizações com médias na casa dos 3.00 sendo 2.00 no alvo. 🎯</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 12,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- CHE ADAMS -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        CHE ADAMS ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].escocia}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/escocia/jogadores/cheadams.jpg" alt="Che Adams" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O centroavante que assim como seu companheiro atua no futebol italiano vive fase artilheira.</p>
      <p>O camisa 10 somou no ano pela Torino 22 jogos como titular com 8⚽ e 2🅰️, já pela seleção nas eliminatórias titular em 5 das 6 partidas garantiu 2⚽. Pode surpreender!</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 7,00</span>
        <span><strong>☑️ STATUS:</strong> Provável</span>
      </div>
    </div>

    <!-- SHANKLAND -->
    <div style="margin: 35px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; background: rgba(255, 255, 255, 0.02); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="color: #ffd700; margin-top: 0; font-size: 1.4rem; border-left: 4px solid #ffd700; padding-left: 10px; display: flex; align-items: center; gap: 8px;">
        SHANKLAND ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].escocia}
      </h3>
      <p align="center">
        <img loading="lazy" src="/copa2026/escocia/jogadores/shankland.jpg" alt="Paul Wanner" style="width: 100%; max-width: 550px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">
      </p>
      <p>O centroavante de 30 anos chega como sensação na copa por sua seleção após temporada mágica no futebol de seu país.</p>
      <p>Pelo Hearts, time que lutou até a última rodada pelo título escocês o camisa 20 somou 32 jogos com incríveis 19⚽ e 4🅰️, nas eliminatórias participou apenas de 2 partidas somando 17' minutos em média mas garantiu 1⚽.</p>
      <p>Ele chega como o grande improvável do time, nos 2 amistosos recentes pré copa do mundo foi titular em ambos e somou 3⚽ e 1🅰️. Vem pra surpreender! Olho nele.</p>
      <div style="display: flex; gap: 20px; background: rgba(255, 215, 0, 0.1); padding: 12px 18px; border-radius: 6px; font-size: 1rem; border: 1px solid rgba(255, 215, 0, 0.2); margin-top: 15px;">
        <span><strong>💰 VALOR:</strong> C$ 7,00</span>
        <span><strong>⏹️ STATUS:</strong> Nulo</span>
      </div>
    </div>

    <p style="margin-top: 30px; font-weight: 500; font-size: 1.15rem; line-height: 1.8;">
      A Escócia também tem pela frente o jogo mais acessível do grupo diante do Haiti ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].haiti}, é mais do quê crucial somar os 3 pontos pois para se classificar em um grupo com Brasil ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].brasil} e Marrocos ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$flags$2e$js__$5b$client$5d$__$28$ecmascript$29$__["flags"].marrocos} é primordial, vale visar as melhores opções da seleção escocesa.
    </p>
  `
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/copa2026/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "copaPosts",
    ()=>copaPosts
]);
// src/blog-data/copa2026/index.js
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$noruega$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/copa2026/paises/noruega.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$austria$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/copa2026/paises/austria.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$escocia$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/copa2026/paises/escocia.js [client] (ecmascript)");
;
;
;
const copaPosts = [
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$escocia$2e$js__$5b$client$5d$__$28$ecmascript$29$__["escociaPost"],
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$austria$2e$js__$5b$client$5d$__$28$ecmascript$29$__["austriaPost"],
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$paises$2f$noruega$2e$js__$5b$client$5d$__$28$ecmascript$29$__["noruegaPost"]
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/brasileirao2026/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/blog-data/brasileirao2026/index.js
__turbopack_context__.s([
    "brasileiraoPosts",
    ()=>brasileiraoPosts
]);
const brasileiraoPosts = [];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/blog-data/posts.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "posts",
    ()=>posts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/copa2026/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$brasileirao2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/brasileirao2026/index.js [client] (ecmascript)");
;
;
const posts = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["copaPosts"],
    ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$brasileirao2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["brasileiraoPosts"],
    {
        slug: 'a-argentinizacao-no-brasil',
        title: 'A "ARGENTINIZAÇÃO" NO BRASIL',
        subtitle: 'A consolidação da escola argentina de treinadores na Série A',
        category: 'Análise de Mercado',
        date: '9 de Janeiro de 2026',
        author: 'Marcos Lobo',
        coverImage: '/treinadores-argentinos.png',
        content: `
      <p>Após anos de nomes portugueses reinando em solo nacional, vivemos agora uma era onde 25% de nossos treinadores na Série A são "hermanos".</p>
      <p>A escola argentina (ATFA), a cada novo ciclo, vem formando grandes profissionais e se consolidando no mercado brasileiro e internacional. Por serem mais rígidos e testados em níveis mais rigorosos, eles vêm ganhando destaque.</p>
      
      <p align="center">
        <img loading="lazy" src="/treinadores-argentinos.png" alt="Treinadores Argentinos no Brasil" style="width: 100%; max-width: 550px; height: auto; margin: 20px auto; display: block; border-radius: 8px;">
      </p>

      <p>O estilo argentino ganhou força na América do Sul e na Europa; por ser um trabalho objetivo e direto, consegue elevar o nível profissional e vencer escolas arcaicas. Hoje, temos nomes como Diego Simeone, Lionel Scaloni e Martín Anselmi em evidência. E o que eles possuem em comum? Seriedade - do mais experiente ao mais novo.</p>
      <p>Hoje, se seu time é comandado por um "hermano", saiba que ele competirá intensamente pelos 90 minutos. São atletas 100% comprometidos taticamente, que jogam conforme instruídos, respeitando a hierarquia e a responsabilidade com o jogo.</p>
      <p>Nossa metodologia ainda está longe do ideal, e ver o compromisso e a evolução do nosso vizinho deveria criar um sinal de alerta e uma mudança de rota nas escolas brasileiras de profissionais do futebol.</p>
      <p>Como podemos ver, esse crescimento exponencial não é surpresa. Falta ao treinador brasileiro essa identificação para com seu jogador; na maioria das vezes, ele não consegue extrair a melhor versão do atleta, deixando nossos times aquém do que poderiam desempenhar. O estilo argentino veio para ficar enquanto o brasileiro não quiser "pelear" de verdade por seu espaço.</p>
    `
    },
    {
        slug: 'renome-nao-e-rendimento',
        title: 'RENOME NÃO É RENDIMENTO💡',
        subtitle: 'A armadilha do "ganho midiático" e a falta de paciência com o processo no futebol brasileiro',
        category: 'Desempenho de atleta',
        date: '24 de outubro de 2025',
        author: 'Marcos Lobo',
        coverImage: '/alisson-santos.jpg',
        content: `
    <p>Muitos dos clubes brasileiros estão acostumados a colocar para debaixo do tapete seus erros e escolhas ruins ao "calar" seus torcedores de redes sociais com escolhas de jogadores renomados, visando apenas ganho midiatico.</p>
    <p>Nós somos um dos maiores formadores e potenciais de atletas profissionais do mundo; porém, não sabemos fazer a utilização correta, pois muitos desses atletas não têm o perfil ou o status que os torcedores esperam.</p>
    <h2>O talento que o Brasil não quis esperar</h2>
    <p align="center">
        <img loading="lazy" src="/alisson-santos.jpg" alt="Jogador Alisson Santos do Sporting" style="width: 100%; max-width: 550px; height: auto; margin: 20px auto; display: block; border-radius: 8px;">
    </p>
    <p>Alisson Santos é mais um belo exemplo de como um olhar diferente e uma oportunidade podem te fazer diferente: da série C em agosto de 2024 para 2 gols na Champions League em outubro de 2025. O que eles viram que nós não vimos? Ele é só mais um caso dos milhares que poderia citar. </p>
    <p>Uma coisa eu tenho certeza: não temos paciência com o processo de integração desse tipo de jogador, pois os minutos que ele poderia ter ficam a cargo de jogadores renomados com baixo rendimento. Temos urgentemente que desassociar o jogador + rendimento = nome badalado. O futebol é feito de jogadores que passam por processos; estamos fazendo esse ciclo de forma invertida.</p>
    <p>O futebol, assim como na vida, existem processos de maturação e de aprendizado; quanto mais pacientes formos com os nossos atletas, mais positivos serão os resultados em campo e fora dele no futuro.</p>
    `
    },
    {
        slug: 'o-improvavel-mirassol',
        title: 'O IMPROVÁVEL MIRASSOL 🌞',
        subtitle: 'A ascensão surpreendente do Mirassol no futebol brasileiro',
        category: 'Análise de Clubes',
        date: '26 de Setembro de 2025',
        author: 'Marcos Lobo',
        coverImage: '/mirassol.jpg',
        content: `  
      <p>Sim, eu sei que o time do interior paulista era cotado para segurar a laterna do campeonato brasileiro, justamente em seu ano de acesso. Seus inúmeros jogadores que não serviam em outros clubes e por sua falta de tradição o fizeram menosprezado, mas o futebol não é uma matemática exata.</p>
      <p>O Leão da Alta Araraquarense completa seus 100 anos de história em 2025 e como presente mais que especial ao seu apaixonado torcedor está jogando a elite do campeonato nacional, e muito além disso, superando expectativas.</p>
      <p>Tudo se iniciou através de Luiz Araújo, jovem promessa da base vendida ao São Paulo, que em 2018 foi vendido pelo tricolor ao Lille-FRA. O time do interior manteve 20% de uma futura venda do atleta que lhe rendeu na época 9 milhões de reais.</p>
      <p>Do montante, 6,5 milhões foram investidos em seu CT de alta performance e cuidado científico com seus atletas e staff. O espaço conta com 4 campos oficiais, aparelhos de última geração, piscinas, apartamentos para concentração e até mesmo de uma cápsula de flutuação onde os atletas flutuam em uma água morna salina que tem como principais benefícios redução de estresse, alívio de dores e melhorias no sono e bem-estar.</p>
      <h2>A Força do Coletivo e a Gestão como Diferencial</h2>
      <p align="center">
        <img loading="lazy" src="/mirassol.jpg" alt="Estrutura e CT do Mirassol Futebol Clube" style="width: 100%; max-width: 550px; height: auto; margin: 20px auto; display: block; border-radius: 8px;">
      </p>
      <p>O time vem fazendo uma campanha histórica na série mas algo me chama muito atenção: a quantidade de jogadores em final de contrato - são incríveis 15 jogadores com contratos até o final de 2025 entre vínculos definitivos e empréstimos. O veterano lateral-esquerdo Reinaldo é um caso deles, o camisa 6 soma 8 gols e 3 assistências e tem sido o principal destaque despontando até como o melhor da posição no campeonato, o seu contrato se encerra em 31/12/25.</p>
      <p>O técnico Rafael Guanaes tem parcela crucial no desempenho do time, o paulista da capital tem um jogo muito bem construído apartir do 4-2-3-1 de muita eficiência tática, jogo aproximado e principalmente de DNA ofensivo, o time tem o 2⁰ melhor ataque da competição superando clubes como Palmeiras e Botafogo, figura também entre os times que mais criam grandes chances, sendo o 5⁰ no geral.</p>
      <p>Acima de tudo, lá atrás, o Mira entendeu que cuidar dos seus atletas e blindar seu staff técnico seria crucial para sonhar e desempenhar dentro de campo. O cuidado com a parte física e mental dos atletas e da comissão fez e faz total diferença, o time da cidade de 65 mil habitantes fez do profissionalismo o seu melhor aliado. O futuro é promissor em terras Mirassolenses.</p>
    `
    },
    {
        slug: 'maturidade-no-futebol-jose-lopez',
        title: 'O FUTEBOL E SUA MATURIDADE ⏳',
        subtitle: 'O caso José "Flaco" López',
        category: 'Desempenho de atleta',
        date: '19 de Setembro de 2025',
        author: 'Marcos Lobo',
        coverImage: '/flaco.png',
        content: `
      <p>No mundo esportivo - especialmente no futebol - a maturação de um jogador exige tempo e paciência. Somos um país rico em jovens promessas latinas, que muitas vezes migram cedo, carregando em si responsabilidades exageradas.</p>
      <p>Enxergar o potencial de um jovem não é o desafio principal. O verdadeiro desafio está em preparar, lapidar e desenvolver esse potencial até que ele se transforme em um atleta de alto desempenho. Abel Ferreira soube conduzir esse processo com José López, o "Flaco".</p>
      <h2>O processo de adaptação de "Flaco" López</h2>
      <p align="center">
      <img loading="lazy" src="/flaco.png" alt="Imagem do jogador Flaco Lopez" style="width: 100%; max-width: 550px; height: auto; margin: 20px auto; display: block; border-radius: 8px;">
      </p>
      </p>
      <p>O argentino chegou ao Brasil em 2022, cercado de expectativa pelas cifras investidas e pela carência do torcedor passional, por um “salvador”. Mas o processo não foi imediato.</p>
      <p>Em entrevista recente, João Martins, auxiliar de Abel, revelou as dificuldades de adaptação do argentino: sono desregulado, alimentação desbalanceada e até problemas de concentração/atenção.</p>
      <p>Após um período de instabilidade, 2025 se tornou seu ano de afirmação. Adaptado e atuando em nova função, soma 17 gols e 3 assistências na temporada.</p>
      <p>Qualidade ele sempre teve. Faltava o que muitos ignoram: tempo, maturação e paciência. Nós, que analisamos o futebol além da emoção, temos a responsabilidade de ajudar o público a compreender o jogo com mais profundidade.</p>
      <p>O cuidado importa. A conversa importa. E acima de tudo: confiar no produto e no processo.</p>
    `
    },
    {
        slug: 'o-jogo-sem-bola-futebol-moderno',
        title: 'O JOGO SEM BOLA 🚫⚽',
        subtitle: 'A importância do jogo sem bola no futebol moderno',
        category: 'Análise Tática',
        date: '19 de Setembro de 2025',
        author: 'Marcos Lobo',
        coverImage: '/christian.png',
        content: `
      <p>No futebol moderno, não há mais espaço apenas para jogadores com refino técnico. O jogo sem bola se tornou essencial em equipes de alto rendimento.</p>
      <p>Um estudo recente publicado pelo European Journal of Sport Science indica que cada time tem, em média, 107 posses de bola por jogo, com duração média de 16 segundos cada, totalizando cerca de 29 minutos de posse por time em uma partida de 90 minutos.</p>
      <p>Trazendo isso para os protagonistas, os jogadores, temos uma média de 1 a 2 minutos de posse por atleta. Ou seja, mais de 88,33% do tempo em campo é de jogo sem bola.</p>
      <h2>Christian: O exemplo da eficiência tática</h2>
      <p align="center">
        <img loading="lazy" src="/christian.png" alt="Imagem do jogador Christian" style="width: 100%; max-width: 550px; height: auto; margin: 20px auto; display: block; border-radius: 8px;">
      </p>
      <p>Falando em 88, Christian, do Cruzeiro, comandado por Leonardo Jardim, representa bem essa nova maneira de enxergar o jogo. O jovem polivalente e disciplinado taticamente, é uma peça vital no esquema e no sucesso do time em 2025.</p>
      <p>Um extremo com números defensivos acima da média chama atenção. Não é o habitual, nem o esperado por torcedores ou analistas. Mas acostumem-se: o futebol mudou.</p>
      <p>Hoje, vencer cada duelo, cada metro, é vencer a partida. Christian faz dos seus 88 minutos sem a bola algo crucial para o coletivo. O talento ainda importa, mas o trabalho que poucos enxergam é o que sustenta o alto nível no longo prazo.</p>
    `
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/pages/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-components/dist/styled-components.browser.esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$HeroSection$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/HeroSection.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PostCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PostCard.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$posts$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/posts.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/copa2026/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$brasileirao2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/blog-data/brasileirao2026/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
;
;
;
;
;
;
;
;
const LatestPostsSection = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].section.withConfig({
    displayName: "pages__LatestPostsSection",
    componentId: "sc-65787ec0-0"
})`
  text-align: center;
`;
_c = LatestPostsSection;
const SectionTitle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].h2.withConfig({
    displayName: "pages__SectionTitle",
    componentId: "sc-65787ec0-1"
})`
  font-size: 2.5rem;
  margin-bottom: 40px;
  color: var(--white);

  @media (max-width: 768px) {
    font-size: 2rem; /* Reduz o tamanho da fonte */
  }
`;
_c1 = SectionTitle;
const CopaSection = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].section.withConfig({
    displayName: "pages__CopaSection",
    componentId: "sc-65787ec0-2"
})`
  text-align: center;
  margin-bottom: 60px;
  padding: 45px 30px;
  background: linear-gradient(135deg, rgba(10, 31, 29, 0.8) 0%, rgba(7, 28, 16, 0.9) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;
_c2 = CopaSection;
const CopaTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(SectionTitle).withConfig({
    displayName: "pages__CopaTitle",
    componentId: "sc-65787ec0-3"
})`
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  margin-bottom: 10px;
`;
_c3 = CopaTitle;
const CopaSubtitle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].p.withConfig({
    displayName: "pages__CopaSubtitle",
    componentId: "sc-65787ec0-4"
})`
  color: var(--light-grey);
  margin-bottom: 40px;
  font-size: 1.1rem;
`;
_c4 = CopaSubtitle;
const PostGrid = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].div.withConfig({
    displayName: "pages__PostGrid",
    componentId: "sc-65787ec0-5"
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  text-align: left;
`;
_c5 = PostGrid;
const ViewAllButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]).withConfig({
    displayName: "pages__ViewAllButton",
    componentId: "sc-65787ec0-6"
})`
  display: inline-block;
  margin-top: 40px;
  padding: 12px 30px;
  background: var(--orange);
  color: var(--black);
  font-weight: 700;
  border-radius: 5px;
  transition: background 0.2s ease;

  &:hover {
    background: #ff8d3b;
    color: var(--black);
  }
`;
_c6 = ViewAllButton;
const CopaViewButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(ViewAllButton).withConfig({
    displayName: "pages__CopaViewButton",
    componentId: "sc-65787ec0-7"
})`
  background: #ffd700;
  color: #071c10;
  margin-top: 30px;

  &:hover {
    background: #ffea70;
    color: #071c10;
  }
`;
_c7 = CopaViewButton;
const BrasileiraoSection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(CopaSection).withConfig({
    displayName: "pages__BrasileiraoSection",
    componentId: "sc-65787ec0-8"
})`
  background: linear-gradient(135deg, rgba(10, 33, 19, 0.8) 0%, rgba(13, 56, 30, 0.9) 100%);
  border: 1px solid rgba(255, 223, 0, 0.3);
`;
_c8 = BrasileiraoSection;
const BrasileiraoTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(CopaTitle).withConfig({
    displayName: "pages__BrasileiraoTitle",
    componentId: "sc-65787ec0-9"
})`
  color: #ffdf00;
  text-shadow: 0 0 10px rgba(255, 223, 0, 0.3);
`;
_c9 = BrasileiraoTitle;
const BrasileiraoViewButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])(CopaViewButton).withConfig({
    displayName: "pages__BrasileiraoViewButton",
    componentId: "sc-65787ec0-10"
})`
  background: #ffdf00;
  color: #0a2113;

  &:hover {
    background: #ffe84d;
    color: #0a2113;
  }
`;
_c10 = BrasileiraoViewButton;
function HomePage() {
    const latestStandardPosts = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$posts$2e$js__$5b$client$5d$__$28$ecmascript$29$__["posts"].filter((post)=>!post.isWorldCup && !post.isBrasileirao).slice(0, 3);
    const featuredCopaPosts = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$copa2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["copaPosts"].slice(0, 3);
    const featuredBrasileiraoPosts = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$blog$2d$data$2f$brasileirao2026$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["brasileiraoPosts"].slice(0, 3);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$HeroSection$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/pages/index.js",
                lineNumber: 106,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container",
                children: [
                    featuredCopaPosts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopaSection, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopaTitle, {
                                children: "COPA DO MUNDO 2026"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopaSubtitle, {
                                children: "Confira as análises especiais das seleções da Copa"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PostGrid, {
                                children: featuredCopaPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PostCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        slug: post.slug,
                                        title: post.title,
                                        category: post.category,
                                        flagCode: post.flagCode,
                                        subtitle: post.subtitle,
                                        coverImage: post.coverImage
                                    }, post.slug, false, {
                                        fileName: "[project]/src/pages/index.js",
                                        lineNumber: 114,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 112,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopaViewButton, {
                                href: "/copa2026",
                                children: "Ver Todas as Análises da Copa"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.js",
                        lineNumber: 109,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BrasileiraoSection, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BrasileiraoTitle, {
                                children: "BRASILEIRÃO 2026"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopaSubtitle, {
                                children: "Acompanhe as análises exclusivas dos principais clubes do Brasil"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this),
                            featuredBrasileiraoPosts.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PostGrid, {
                                children: featuredBrasileiraoPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PostCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        slug: post.slug,
                                        title: post.title,
                                        category: post.category,
                                        flagCode: post.flagCode,
                                        subtitle: post.subtitle,
                                        coverImage: post.coverImage
                                    }, post.slug, false, {
                                        fileName: "[project]/src/pages/index.js",
                                        lineNumber: 136,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: 'var(--light-grey)',
                                    margin: '20px 0 40px',
                                    fontStyle: 'italic',
                                    fontSize: '1.1rem'
                                },
                                children: "Nenhuma análise publicada ainda. Fique atento as próximas análises do campeonato!"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BrasileiraoViewButton, {
                                href: "/brasileirao2026",
                                children: "Ver Tudo do Brasileirão"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.js",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LatestPostsSection, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                children: "Últimas Análises"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 156,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PostGrid, {
                                children: latestStandardPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PostCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        slug: post.slug,
                                        title: post.title,
                                        category: post.category,
                                        flagCode: post.flagCode,
                                        subtitle: post.subtitle,
                                        coverImage: post.coverImage
                                    }, post.slug, false, {
                                        fileName: "[project]/src/pages/index.js",
                                        lineNumber: 159,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 157,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ViewAllButton, {
                                href: "/blog",
                                children: "Ver Todas as Análises"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.js",
                                lineNumber: 170,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.js",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.js",
                lineNumber: 107,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c11 = HomePage;
const __TURBOPACK__default__export__ = HomePage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "LatestPostsSection");
__turbopack_context__.k.register(_c1, "SectionTitle");
__turbopack_context__.k.register(_c2, "CopaSection");
__turbopack_context__.k.register(_c3, "CopaTitle");
__turbopack_context__.k.register(_c4, "CopaSubtitle");
__turbopack_context__.k.register(_c5, "PostGrid");
__turbopack_context__.k.register(_c6, "ViewAllButton");
__turbopack_context__.k.register(_c7, "CopaViewButton");
__turbopack_context__.k.register(_c8, "BrasileiraoSection");
__turbopack_context__.k.register(_c9, "BrasileiraoTitle");
__turbopack_context__.k.register(_c10, "BrasileiraoViewButton");
__turbopack_context__.k.register(_c11, "HomePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/index.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/index.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if ("TURBOPACK compile-time truthy", 1) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/index\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/index.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0u-h1kd._.js.map