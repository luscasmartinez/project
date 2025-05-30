import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Trash2, Edit2, LogOut, Lock, Unlock, Users } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { CardModal } from './components/CardModal';
import { PermissionsModal } from './components/PermissionsModal';
import { useAuthStore } from './store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Board, List, Card } from './types';

function App() {
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const { user, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const listsQuery = query(collection(db, 'lists'), orderBy('order'));
    const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
      const listsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as List[];
      
      const filteredLists = listsData.filter(list => 
        list.is_public || 
        isAdmin || 
        (list.allowed_users && list.allowed_users.includes(user?.uid || ''))
      );
      
      setLists(filteredLists);
    });

    const cardsQuery = query(collection(db, 'cards'), orderBy('order'));
    const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Card[];
      setCards(cardsData);
    });

    return () => {
      unsubscribeLists();
      unsubscribeCards();
    };
  }, [user, isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleListAccess = async (list: List) => {
    if (!isAdmin) return;
    
    const listRef = doc(db, 'lists', list.id);
    await updateDoc(listRef, {
      is_public: !list.is_public
    });
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const newList = {
      title: newListTitle,
      order: lists.length,
      board_id: '1',
      created_at: new Date().toISOString(),
      is_public: false,
      allowed_users: []
    };

    await addDoc(collection(db, 'lists'), newList);
    setNewListTitle('');
  };

  const handleAddCard = async (listId: string) => {
    const newCard = {
      title: 'New Card',
      description: '',
      order: cards.filter(card => card.list_id === listId).length,
      list_id: listId,
      created_at: new Date().toISOString(),
      tags: []
    };

    await addDoc(collection(db, 'cards'), newCard);
  };

  const handleDeleteList = async (listId: string) => {
    const listCards = cards.filter(card => card.list_id === listId);
    const batch = writeBatch(db);
    
    listCards.forEach(card => {
      const cardRef = doc(db, 'cards', card.id);
      batch.delete(cardRef);
    });
    
    const listRef = doc(db, 'lists', listId);
    batch.delete(listRef);
    
    await batch.commit();
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteDoc(doc(db, 'cards', cardId));
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (updatedCard: Partial<Card>) => {
    if (!selectedCard) return;
    
    const cardRef = doc(db, 'cards', selectedCard.id);
    await updateDoc(cardRef, updatedCard);
  };

  const handleUpdatePermissions = async (userIds: string[]) => {
    if (!selectedList) return;
    
    const listRef = doc(db, 'lists', selectedList.id);
    await updateDoc(listRef, {
      allowed_users: userIds
    });
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, type, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      if (type === 'LIST') {
        const batch = writeBatch(db);
        const reorderedLists = Array.from(lists);
        const [removed] = reorderedLists.splice(source.index, 1);
        reorderedLists.splice(destination.index, 0, removed);

        reorderedLists.forEach((list, index) => {
          const listRef = doc(db, 'lists', list.id);
          batch.update(listRef, { order: index });
        });

        await batch.commit();
      } else {
        const batch = writeBatch(db);
        const sourceList = cards.filter(card => card.list_id === source.droppableId);
        const destList = cards.filter(card => card.list_id === destination.droppableId);
        const draggedCard = cards.find(card => card.id === draggableId);

        if (!draggedCard) return;

        sourceList.splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
          sourceList.splice(destination.index, 0, draggedCard);
          
          sourceList.forEach((card, index) => {
            const cardRef = doc(db, 'cards', card.id);
            batch.update(cardRef, { order: index });
          });
        } else {
          destList.splice(destination.index, 0, draggedCard);
          
          sourceList.forEach((card, index) => {
            const cardRef = doc(db, 'cards', card.id);
            batch.update(cardRef, { order: index });
          });
          
          destList.forEach((card, index) => {
            const cardRef = doc(db, 'cards', card.id);
            batch.update(cardRef, { 
              order: index,
              list_id: destination.droppableId 
            });
          });
        }

        await batch.commit();
      }
    } catch (error) {
      console.error('Error updating after drag:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Kanban Board</h1>
          <div className="flex items-center gap-4">
            <span className="text-white">
              {user?.email} ({isAdmin ? 'Admin' : 'User'})
            </span>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="LIST" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full"
>
                {lists.map((list, index) => (
                  <Draggable 
                    key={list.id} 
                    draggableId={list.id} 
                    index={index}
                    isDragDisabled={!isAdmin}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-gray-100 rounded-lg p-4 w-full  ${
                          snapshot.isDragging ? 'shadow-2xl ring-2 ring-white/50' : ''
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="flex justify-between items-center mb-4"
                        >
                          <h2 className="text-lg font-semibold">{list.title}</h2>
                          <div className="flex gap-2">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedList(list);
                                    setIsPermissionsModalOpen(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Manage user access"
                                >
                                  <Users size={20} />
                                </button>
                                <button
                                  onClick={() => toggleListAccess(list)}
                                  className={`${
                                    list.is_public ? 'text-green-500' : 'text-gray-500'
                                  } hover:text-gray-700`}
                                  title={list.is_public ? 'Make private' : 'Make public'}
                                >
                                  {list.is_public ? <Unlock size={20} /> : <Lock size={20} />}
                                </button>
                                <button 
                                  onClick={() => handleDeleteList(list.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete list"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <Droppable droppableId={list.id} type="CARD">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-2 min-h-[200px] ${
                                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                              }`}
                            >
                              {cards
                                .filter(card => card.list_id === list.id)
                                .sort((a, b) => a.order - b.order)
                                .map((card, index) => (
                                  <Draggable
                                    key={card.id}
                                    draggableId={card.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white p-3 rounded shadow-sm group
                                          ${snapshot.isDragging 
                                            ? 'shadow-xl ring-2 ring-blue-400 rotate-2' 
                                            : 'hover:shadow-md'
                                          } transition-all duration-200`}
                                        onClick={() => handleEditCard(card)}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                            <p className="text-sm md:text-base truncate">{card.title}</p>
                                            {card.tags && card.tags.length > 0 && (
                                              <div className="flex gap-1 flex-shrink-0">
                                                {card.tags.map((tag, index) => (
                                                  <span 
                                                    key={index} 
                                                    className={`${tag.color} text-white text-xs px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap`}
                                                  >
                                                    {tag.label}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCard(card);
                                              }}
                                              className="text-blue-500 hover:text-blue-700"
                                            >
                                              <Edit2 size={14} className="md:size-4" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCard(card.id);
                                              }}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 size={14} className="md:size-4" />
                                            </button>
                                          </div>
                                        </div>
                                        {card.description && (
                                          <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                                            {card.description}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <button
                          onClick={() => handleAddCard(list.id)}
                          className="w-full mt-2 md:mt-3 p-1.5 md:p-2 text-gray-500 hover:bg-gray-200 rounded flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
                        >
                          <Plus size={16} className="md:size-5" />
                          <span>Add Card</span>
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {isAdmin && (
                  <form onSubmit={handleAddList} className="w-80 flex-shrink-0">
                    <input
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Add new list"
                      className="w-full p-4 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </form>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCard(null);
          }}
          onSave={handleSaveCard}
          existingTags={[]}
        />
      )}

      {selectedList && (
        <PermissionsModal
          list={selectedList}
          isOpen={isPermissionsModalOpen}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedList(null);
          }}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}
    </div>
  );
}

export default App;