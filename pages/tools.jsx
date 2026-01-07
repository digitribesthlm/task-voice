import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { connectToDatabase } from '../lib/mongodb';
import { ensureDefaultToolsCollection, getToolsSortSpec } from '../lib/antigravityTools';

export async function getServerSideProps({ req }) {
  const { isRequestAuthenticated } = await import('../lib/auth');

  if (!isRequestAuthenticated(req)) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('antigravity_tools');
    await ensureDefaultToolsCollection(collection);
    const tools = await collection.find({}).sort(getToolsSortSpec()).toArray();
    const serialize = (data) => JSON.parse(JSON.stringify(data));

    return {
      props: {
        initialTools: serialize(tools),
      },
    };
  } catch (error) {
    console.error('Failed to fetch tool data:', error);
    return {
      props: { initialTools: [], error: 'Failed to load tools' },
    };
  }
}

const ToolsPage = ({ initialTools, error }) => {
  const router = useRouter();
  const [tools, setTools] = useState(initialTools || []);
  const [formData, setFormData] = useState({ title: '', description: '', url: '', labels: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedLabel = labelFilter.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        !normalizedSearch ||
        tool.title.toLowerCase().includes(normalizedSearch) ||
        (tool.description || '').toLowerCase().includes(normalizedSearch);
      const matchesLabel =
        !normalizedLabel ||
        (tool.labels || []).some((label) => label.toLowerCase().includes(normalizedLabel));
      return matchesSearch && matchesLabel;
    });
  }, [tools, normalizedSearch, normalizedLabel]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Failed to log out', err);
    } finally {
      router.replace('/login');
    }
  };

  const goHome = () => router.push('/');

  const resetForm = () => {
    setFormData({ title: '', description: '', url: '', labels: '' });
    setFormError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const handleAddTool = async (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.url.trim()) {
      setFormError('Title and URL are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to add tool');
      }

      const { tool } = await response.json();
      setTools((prev) => [tool, ...prev]);
      resetForm();
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to add tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTool = async (id) => {
    const originalTools = [...tools];
    setTools((prev) => prev.filter((tool) => tool.id !== id));

    try {
      const response = await fetch('/api/tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to delete tool');
      }
    } catch (err) {
      console.error(err);
      setTools(originalTools);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#10172A] text-white">
        <div className="text-center space-y-4">
          <p>Unable to load your tools right now.</p>
          <button
            type="button"
            onClick={goHome}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10172A] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onLogout={handleLogout} />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goHome}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            Back to Dashboard
          </button>
        </div>

        <main className="mt-8 space-y-8">
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Tool Library</h2>
                  <p className="text-slate-400 text-sm">
                    Keep a quick reference of every platform, dashboard, or utility you use.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleFormVisibility}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold text-slate-900 transition-colors duration-200"
                >
                  {isFormVisible ? 'Close' : 'Add Tool'}
                </button>
              </div>
              {!isFormVisible && (
                <p className="text-sm text-slate-500">
                  Ready to capture another tool? Hit “Add Tool” and the form will slide out.
                </p>
              )}
            </div>

            {isFormVisible && (
              <form className="grid gap-4" onSubmit={handleAddTool}>
                <div>
                  <label className="text-sm text-slate-300 block mb-1" htmlFor="title">Tool Name *</label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Ex: Looker Studio"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1" htmlFor="url">Tool URL *</label>
                  <input
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1" htmlFor="description">Short Description</label>
                  <input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="What does this tool help with?"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1" htmlFor="labels">Labels (comma separated)</label>
                  <input
                    id="labels"
                    name="labels"
                    value={formData.labels}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Ex: client, seo, reporting"
                  />
                  <p className="text-xs text-slate-500 mt-1">Use tags to group tools by purpose, team, or client.</p>
                </div>
                {formError && (
                  <div className="text-sm text-red-400">{formError}</div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsFormVisible(false);
                    }}
                    className="px-4 py-2 border border-slate-600 hover:bg-slate-800 rounded-lg text-white transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/60 rounded-lg font-semibold text-slate-900 transition-colors duration-200"
                  >
                    {isSubmitting ? 'Adding...' : 'Save Tool'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Your Tool Stack</h2>
              <p className="text-sm text-slate-400">{tools.length} tool{tools.length === 1 ? '' : 's'}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-slate-300 block mb-1" htmlFor="search">Search</label>
                <input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Filter by name or description"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-slate-300 block mb-1" htmlFor="labelFilter">Label filter</label>
                <input
                  id="labelFilter"
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Ex: seo, client"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setLabelFilter('');
                }}
                className="px-4 py-2 border border-slate-600 hover:bg-slate-800 rounded-lg text-white transition-colors duration-200"
              >
                Clear
              </button>
            </div>

            {filteredTools.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                {tools.length === 0
                  ? 'Nothing logged yet. Add your first tool above to build a visual reference of your stack.'
                  : 'No tools match your filters. Adjust the search or label filter to see more.'}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => (
                  <div key={tool.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{tool.title}</h3>
                        {tool.description ? (
                          <p className="text-sm text-slate-400 mt-1">{tool.description}</p>
                        ) : (
                          <p className="text-sm text-slate-500 mt-1 italic">No description added</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTool(tool.id)}
                        className="text-xs uppercase tracking-wide text-red-300 hover:text-red-200 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                    {tool.labels && tool.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tool.labels.map((label) => (
                          <span key={`${tool.id}-${label}`} className="px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-300">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
                    >
                      Visit tool
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ToolsPage;

