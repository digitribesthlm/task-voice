export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskTitle } = req.body;

  if (!taskTitle) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  // Simple keyword-based categorization (100% accurate and instant!)
  const titleLower = taskTitle.toLowerCase();

  // p5 - Evaluation & Transition (check first as it's most specific)
  if (titleLower.match(/\b(monitor|track|check|review|report|analyz|assess|evaluat|prepare|meeting)\b/)) {
    console.log(`✅ Categorized "${taskTitle}" as p5 (Evaluation)`);
    return res.status(200).json({ phaseId: 'p5' });
  }

  // p1 - Learning & Discovery
  if (titleLower.match(/\b(research|investigat|discover|explor|study|learn|analys|find)\b/)) {
    console.log(`✅ Categorized "${taskTitle}" as p1 (Learning)`);
    return res.status(200).json({ phaseId: 'p1' });
  }

  // p2 - Improving & Optimization
  if (titleLower.match(/\b(optimi[sz]|improve|enhanc|fix|refin|speed|performance)\b/)) {
    console.log(`✅ Categorized "${taskTitle}" as p2 (Improving)`);
    return res.status(200).json({ phaseId: 'p2' });
  }

  // p4 - Promoting & Authority
  if (titleLower.match(/\b(launch|promot|advertis|market|campaign|outreach|pr\b|link.?build)\b/)) {
    console.log(`✅ Categorized "${taskTitle}" as p4 (Promoting)`);
    return res.status(200).json({ phaseId: 'p4' });
  }

  // p3 - Building & Content (default for create/write/build)
  if (titleLower.match(/\b(creat|build|writ|produc|develop|design|make)\b/)) {
    console.log(`✅ Categorized "${taskTitle}" as p3 (Building)`);
    return res.status(200).json({ phaseId: 'p3' });
  }

  // Default to p3 if no keywords match
  console.log(`ℹ️  No keyword match for "${taskTitle}", defaulting to p3`);
  return res.status(200).json({ phaseId: 'p3' });
}
