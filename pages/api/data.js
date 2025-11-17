import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
        const clients = await db.collection('app_clients').find({}).toArray();
        const phases = await db.collection('app_phases').find({}).toArray();
        const todayTasks = await db.collection('app_todayTasks').find({}).sort({ _id: 1 }).toArray();
        const weekTasks = await db.collection('app_weekTasks').find({}).toArray();
        const monthMilestones = await db.collection('app_monthMilestones').find({}).toArray();
        const weeklyTarget = await db.collection('app_weeklyTarget').findOne({});
        const automations = await db.collection('app_automations').find({}).toArray();

        res.status(200).json({ clients, phases, todayTasks, weekTasks, monthMilestones, weeklyTarget, automations });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
  } else if (req.method === 'POST') {
     try {
        const { type, ...data } = req.body;
        // remove the client-side generated _id if it exists, let mongo generate it
        delete data._id;
        
        let collection = 'app_todayTasks';
        if (type === 'week') collection = 'app_weekTasks';
        else if (type === 'month') collection = 'app_monthMilestones';
        
        const result = await db.collection(collection).insertOne(data);
        res.status(201).json({ message: 'Task added successfully', insertedId: result.insertedId });
     } catch (error) {
        res.status(500).json({ message: 'Error adding task', error: error.message });
     }
  } else if (req.method === 'PUT') {
      try {
        const { taskId, completed } = req.body;
        if (!taskId) {
          return res.status(400).json({ message: 'Task ID is required' });
        }
        
        const result = await db.collection('app_todayTasks').updateOne(
            { id: taskId }, 
            { $set: { completed: completed } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task updated successfully' });
      } catch (error) {
          res.status(500).json({ message: 'Error updating task', error: error.message });
      }
  } else if (req.method === 'DELETE') {
      try {
        const { taskId } = req.body;
        if (!taskId) {
          return res.status(400).json({ message: 'Task ID is required' });
        }
        
        const result = await db.collection('app_todayTasks').deleteOne({ id: taskId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
      } catch (error) {
          res.status(500).json({ message: 'Error deleting task', error: error.message });
      }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
