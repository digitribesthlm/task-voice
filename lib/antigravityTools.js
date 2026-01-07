const DEFAULT_TOOL_DEFINITIONS = [
  {
    id: 'tool_sop_portal',
    title: 'Digitribe SOP Portal',
    description: 'Internal SOP documentation hub for agency processes and playbooks.',
    url: 'https://sop.digitribe.se/',
    pinned: true,
    labels: ['documentation', 'ops'],
  },
];

function createDefaultToolsPayload() {
  const timestamp = new Date().toISOString();
  return DEFAULT_TOOL_DEFINITIONS.map((tool) => ({
    ...tool,
    createdAt: timestamp,
    labels: Array.isArray(tool.labels) ? tool.labels : [],
  }));
}

export async function ensureDefaultToolsCollection(collection) {
  const expectedIds = DEFAULT_TOOL_DEFINITIONS.map((tool) => tool.id);
  const existing = await collection
    .find({ id: { $in: expectedIds } })
    .project({ id: 1 })
    .toArray();

  const existingIds = new Set(existing.map((doc) => doc.id));
  const missingTools = createDefaultToolsPayload().filter((tool) => !existingIds.has(tool.id));

  if (missingTools.length > 0) {
    await collection.insertMany(missingTools);
  }
}

export function getToolsSortSpec() {
  return { pinned: -1, title: 1 };
}

