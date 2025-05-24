import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, BookOpen, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Supabase configuration - replace with your actual values
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Simple Supabase client implementation
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key
    };
  }

  async from(table) {
    return {
      select: async (columns = '*') => {
        const response = await fetch(`${this.url}/rest/v1/${table}?select=${columns}`, {
          headers: this.headers
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      },
      
      insert: async (values) => {
        const response = await fetch(`${this.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(values)
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      },
      
      update: async (values) => ({
        eq: async (column, value) => {
          const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(values)
          });
          const data = await response.json();
          return { data, error: response.ok ? null : data };
        }
      }),
      
      delete: async () => ({
        eq: async (column, value) => {
          const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
            headers: this.headers
          });
          return { error: response.ok ? null : 'Delete failed' };
        }
      })
    };
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App = () => {
  const [arcs, setArcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    genre: '',
    publishDate: '',
    receivedDate: '',
    coverImage: '',
    description: '',
    reviewCompleted: false,
    reviewPlatform: '',
    reviewLink: '',
    promoPostCompleted: false,
    promoPostPlatform: '',
    promoPostLink: '',
    rating: 0,
    notes: ''
  });

  // Load ARCs from Supabase on component mount
  useEffect(() => {
    loadArcs();
  }, []);

  const loadArcs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('arcs').select('*');
      
      if (error) {
        console.error('Error loading ARCs:', error);
        // Fallback to demo data if Supabase isn't configured
        setArcs([
          {
            id: 1,
            title: "Demo Book",
            author: "Demo Author",
            publisher: "Demo Publisher",
            genre: "Fiction",
            publishDate: "2024-12-01",
            receivedDate: "2024-11-01",
            coverImage: "",
            description: "This is a demo book. Configure Supabase to start storing real data!",
            reviewCompleted: false,
            reviewPlatform: "",
            reviewLink: "",
            promoPostCompleted: false,
            promoPostPlatform: "",
            promoPostLink: "",
            rating: 0,
            notes: "Configure your Supabase credentials in the code",
            dateAdded: "2024-11-01"
          }
        ]);
      } else {
        // Convert snake_case to camelCase for compatibility
        const formattedData = data.map(item => ({
          id: item.id,
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          genre: item.genre,
          publishDate: item.publish_date,
          receivedDate: item.received_date,
          coverImage: item.cover_image,
          description: item.description,
          reviewCompleted: item.review_completed,
          reviewPlatform: item.review_platform,
          reviewLink: item.review_link,
          promoPostCompleted: item.promo_post_completed,
          promoPostPlatform: item.promo_post_platform,
          promoPostLink: item.promo_post_link,
          rating: item.rating,
          notes: item.notes,
          dateAdded: item.date_added
        }));
        setArcs(formattedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      publisher: '',
      genre: '',
      publishDate: '',
      receivedDate: '',
      coverImage: '',
      description: '',
      reviewCompleted: false,
      reviewPlatform: '',
      reviewLink: '',
      promoPostCompleted: false,
      promoPostPlatform: '',
      promoPostLink: '',
      rating: 0,
      notes: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert camelCase to snake_case for database
    const dbData = {
      title: formData.title,
      author: formData.author,
      publisher: formData.publisher,
      genre: formData.genre,
      publish_date: formData.publishDate,
      received_date: formData.receivedDate || null,
      cover_image: formData.coverImage,
      description: formData.description,
      review_completed: formData.reviewCompleted,
      review_platform: formData.reviewPlatform,
      review_link: formData.reviewLink,
      promo_post_completed: formData.promoPostCompleted,
      promo_post_platform: formData.promoPostPlatform,
      promo_post_link: formData.promoPostLink,
      rating: formData.rating,
      notes: formData.notes
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('arcs').update(dbData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('arcs').insert([dbData]);
        if (error) throw error;
      }
      
      await loadArcs(); // Reload data
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving ARC:', error);
      alert('Error saving ARC. Please try again.');
    }
  };

  const handleEdit = (arc) => {
    setFormData({
      title: arc.title,
      author: arc.author,
      publisher: arc.publisher,
      genre: arc.genre,
      publishDate: arc.publishDate,
      receivedDate: arc.receivedDate,
      coverImage: arc.coverImage,
      description: arc.description,
      reviewCompleted: arc.reviewCompleted,
      reviewPlatform: arc.reviewPlatform,
      reviewLink: arc.reviewLink,
      promoPostCompleted: arc.promoPostCompleted,
      promoPostPlatform: arc.promoPostPlatform,
      promoPostLink: arc.promoPostLink,
      rating: arc.rating,
      notes: arc.notes
    });
    setEditingId(arc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ARC?')) return;
    
    try {
      const { error } = await supabase.from('arcs').delete().eq('id', id);
      if (error) throw error;
      
      await loadArcs(); // Reload data
    } catch (error) {
      console.error('Error deleting ARC:', error);
      alert('Error deleting ARC. Please try again.');
    }
  };

  const getStatusColor = (arc) => {
    const today = new Date();
    const pubDate = new Date(arc.publishDate);
    const daysUntilPub = Math.ceil((pubDate - today) / (1000 * 60 * 60 * 24));
    
    if (arc.reviewCompleted && arc.promoPostCompleted) return 'bg-green-100 border-green-300';
    if (daysUntilPub < 0) return 'bg-red-100 border-red-300';
    if (daysUntilPub <= 7) return 'bg-yellow-100 border-yellow-300';
    return 'bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (arc) => {
    const today = new Date();
    const pubDate = new Date(arc.publishDate);
    const daysUntilPub = Math.ceil((pubDate - today) / (1000 * 60 * 60 * 24));
    
    if (arc.reviewCompleted && arc.promoPostCompleted) return <CheckCircle className="text-green-500" size={20} />;
    if (daysUntilPub < 0) return <AlertCircle className="text-red-500" size={20} />;
    if (daysUntilPub <= 7) return <Clock className="text-yellow-500" size={20} />;
    return <BookOpen className="text-gray-500" size={20} />;
  };

  const filteredArcs = arcs.filter(arc => {
    if (filter === 'pending-review') return !arc.reviewCompleted;
    if (filter === 'pending-promo') return !arc.promoPostCompleted;
    if (filter === 'completed') return arc.reviewCompleted && arc.promoPostCompleted;
    if (filter === 'urgent') {
      const today = new Date();
      const pubDate = new Date(arc.publishDate);
      return Math.ceil((pubDate - today) / (1000 * 60 * 60 * 24)) <= 7;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-purple-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading ARCs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <BookOpen className="text-purple-600" size={32} />
                ARC Tracker
              </h1>
              <p className="text-gray-600 mt-1">Manage your Advance Reader Copies efficiently</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
            >
              <Plus size={20} />
              Add ARC
            </button>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'all', label: 'All ARCs', count: arcs.length },
              { key: 'pending-review', label: 'Review Pending', count: arcs.filter(a => !a.reviewCompleted).length },
              { key: 'pending-promo', label: 'Promo Pending', count: arcs.filter(a => !a.promoPostCompleted).length },
              { key: 'urgent', label: 'Due Soon', count: arcs.filter(a => {
                const days = Math.ceil((new Date(a.publishDate) - new Date()) / (1000 * 60 * 60 * 24));
                return days <= 7 && days >= 0;
              }).length },
              { key: 'completed', label: 'Completed', count: arcs.filter(a => a.reviewCompleted && a.promoPostCompleted).length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId ? 'Edit ARC' : 'Add New ARC'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.publishDate}
                      onChange={(e) => setFormData({...formData, publishDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                    <input
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({...formData, receivedDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="reviewCompleted"
                        checked={formData.reviewCompleted}
                        onChange={(e) => setFormData({...formData, reviewCompleted: e.target.checked})}
                        className="rounded text-purple-600"
                      />
                      <label htmlFor="reviewCompleted" className="font-medium text-gray-700">Review Completed</label>
                    </div>
                    {formData.reviewCompleted && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Platform (e.g., Goodreads, Blog)"
                          value={formData.reviewPlatform}
                          onChange={(e) => setFormData({...formData, reviewPlatform: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="Review Link"
                          value={formData.reviewLink}
                          onChange={(e) => setFormData({...formData, reviewLink: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">Rating:</span>
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormData({...formData, rating: star})}
                              className={`${formData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              <Star size={16} fill="currentColor" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="promoCompleted"
                        checked={formData.promoPostCompleted}
                        onChange={(e) => setFormData({...formData, promoPostCompleted: e.target.checked})}
                        className="rounded text-purple-600"
                      />
                      <label htmlFor="promoCompleted" className="font-medium text-gray-700">Promo Post Completed</label>
                    </div>
                    {formData.promoPostCompleted && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Platform (e.g., Instagram, Twitter)"
                          value={formData.promoPostPlatform}
                          onChange={(e) => setFormData({...formData, promoPostPlatform: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="Post Link"
                          value={formData.promoPostLink}
                          onChange={(e) => setFormData({...formData, promoPostLink: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    {editingId ? 'Update ARC' : 'Add ARC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArcs.map(arc => {
            const today = new Date();
            const pubDate = new Date(arc.publishDate);
            const daysUntilPub = Math.ceil((pubDate - today) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={arc.id} className={`rounded-xl border-2 p-6 shadow-md hover:shadow-lg transition-shadow ${getStatusColor(arc)}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(arc)}
                    <span className="text-sm font-medium text-gray-600">
                      {daysUntilPub < 0 ? 'Published' : daysUntilPub === 0 ? 'Today!' : `${daysUntilPub} days`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(arc)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(arc.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {arc.coverImage && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={arc.coverImage} 
                      alt={arc.title}
                      className="w-20 h-28 object-cover rounded-lg shadow-md"
                      onError={(e) => {e.target.style.display = 'none'}}
                    />
                  </div>
                )}

                <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2">{arc.title}</h3>
                <p className="text-gray-600 mb-2">by {arc.author}</p>
                
                {arc.genre && (
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-3">
                    {arc.genre}
                  </span>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Publish Date:</span>
                    <span className="font-medium">{new Date(arc.publishDate).toLocaleDateString()}</span>
                  </div>
                  {arc.publisher && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Publisher:</span>
                      <span className="font-medium">{arc.publisher}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${arc.reviewCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-gray-600">Review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${arc.promoPostCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-gray-600">Promo</span>
                  </div>
                  {arc.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" fill="currentColor" />
                      <span className="text-xs text-gray-600">{arc.rating}/5</span>
                    </div>
                  )}
                </div>

                {(arc.reviewLink || arc.promoPostLink) && (
                  <div className="flex gap-2">
                    {arc.reviewLink && (
                      <a 
                        href={arc.reviewLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        View Review
                      </a>
                    )}
                    {arc.promoPostLink && (
                      <a 
                        href={arc.promoPostLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                      >
                        View Post
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredArcs.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No ARCs found for the selected filter.</p>
            <p className="text-gray-500">Add your first ARC to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;