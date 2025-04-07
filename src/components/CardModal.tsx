import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import type { Card, Comment } from '../types';

const TAG_COLORS = [
  { name: 'Vermelho', value: 'bg-red-500' },
  { name: 'Azul', value: 'bg-blue-500' },
  { name: 'Verde', value: 'bg-green-500' },
  { name: 'Amarelo', value: 'bg-yellow-500' },
  { name: 'Roxo', value: 'bg-purple-500' },
  { name: 'Cinza', value: 'bg-gray-500' },
];

interface CardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Partial<Card>) => void;
  existingTags: { label: string; color: string }[];
}

export function CardModal({ card, isOpen, onClose, onSave, existingTags }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [tags, setTags] = useState(card.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0].value);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [comments, setComments] = useState<Comment[]>(card.comments || []);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
    setTags(card.tags || []);
    setComments(card.comments || []);
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      title, 
      description,
      tags,
      comments
    });
    onClose();
  };

  const addTag = (tag?: { label: string; color: string }) => {
    if (tag) {
      if (!tags.some(t => t.label === tag.label)) {
        setTags([...tags, tag]);
      }
    } else if (tagInput.trim()) {
      const newTag = {
        label: tagInput.trim(),
        color: tagColor
      };
      if (!tags.some(t => t.label === newTag.label)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
    setShowTagSuggestions(false);
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        text: newComment,
        createdAt: new Date().toISOString(),
        author: 'Usuário' // Substitua por um sistema de autenticação real
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const filteredTagSuggestions = existingTags.filter(tag => 
    tag.label.toLowerCase().includes(tagInput.toLowerCase()) && 
    !tags.some(t => t.label === tag.label)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Edit Card</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Seção de Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <div 
                  key={index} 
                  className={`${tag.color} text-white text-xs px-2 py-1 rounded-full flex items-center`}
                >
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    placeholder="Select or create tag"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredTagSuggestions.map((tag, index) => (
                        <div
                          key={index}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center`}
                          onClick={() => {
                            addTag(tag);
                            setTagInput('');
                          }}
                        >
                          <span className={`${tag.color} w-3 h-3 rounded-full mr-2`}></span>
                          {tag.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TAG_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addTag()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Seção de Comentários */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-2 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Comentários
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum comentário ainda</p>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{comment.author}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder="Adicionar comentário..."
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addComment}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                Enviar
              </button>
            </div>
          </div>
        </form>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}