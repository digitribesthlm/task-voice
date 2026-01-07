import { connectToDatabase } from '../../lib/mongodb';
import { ensureDefaultToolsCollection, getToolsSortSpec } from '../../lib/antigravityTools';

function sanitizeUrl(url = '') {
  if (!url) return '';
  return url.trim();
}

function parseLabels(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : input.split(',');
  return raw.map((label) => label.trim()).filter(Boolean);
}

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('antigravity_tools');
  await ensureDefaultToolsCollection(collection);

  if (req.method === 'GET') {
    try {
      const tools = await collection.find({}).sort(getToolsSortSpec()).toArray();
      res.status(200).json({ tools });
    } catch (error) {
      res.status(500).json({ message: 'Failed to load tools', error: error.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { title, description, url, id, labels } = req.body || {};

      if (!title || !url) {
        return res.status(400).json({ message: 'Title and URL are required' });
      }

      const parsedLabels = parseLabels(labels);

      const tool = {
        id: id || `tool_${Date.now()}`,
        title: title.trim(),
        description: (description || '').trim(),
        url: sanitizeUrl(url),
        createdAt: new Date().toISOString(),
        pinned: false,
        labels: parsedLabels,
      };

      const result = await collection.insertOne(tool);
      res.status(201).json({ tool: { ...tool, _id: result.insertedId } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add tool', error: error.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ message: 'Tool id is required' });
      }

      const result = await collection.deleteOne({ id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Tool not found' });
      }

      res.status(200).json({ message: 'Tool deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete tool', error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

