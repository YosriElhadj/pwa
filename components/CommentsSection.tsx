'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

interface CommentsSectionProps {
  recipeId: string;
  isPublic?: boolean;
}

export default function CommentsSection({ recipeId, isPublic = true }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPublic) {
      fetchComments();
    }
  }, [recipeId, isPublic]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/recipes/public/${recipeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        setComments(updatedRecipe.comments.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;

    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        setComments(updatedRecipe.comments.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return commentDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!isPublic) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl">💬</span>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Commentaires
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Add Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajoutez votre commentaire... 💭"
              rows={3}
              maxLength={500}
              className="w-full px-5 py-4 resize-none focus:outline-none text-gray-800"
            />
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">
                {newComment.length}/500 caractères
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publier
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl text-center">
          <p className="text-purple-800 font-semibold mb-3">
            🔒 Connectez-vous pour laisser un commentaire
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg"
          >
            Se connecter
          </a>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">💬</span>
          </div>
          <p className="text-gray-600 font-semibold">Aucun commentaire pour le moment</p>
          <p className="text-gray-500 text-sm mt-1">Soyez le premier à commenter cette recette !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.userAvatar ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200">
                      <Image
                        src={comment.userAvatar}
                        alt={comment.userName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{comment.userName}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>

                    {/* Delete button */}
                    {session && (session.user.id === comment.userId) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}