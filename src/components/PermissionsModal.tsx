import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus, Mail, Lock } from 'lucide-react';
import { collection, query, getDocs, addDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import type { User, List } from '../types';

interface PermissionsModalProps {
  list: List;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePermissions: (userIds: string[]) => void;
}

export function PermissionsModal({ list, isOpen, onClose, onUpdatePermissions }: PermissionsModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(list.allowed_users || []);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData.filter(user => !user.isAdmin));
    };

    if (isOpen) {
      fetchUsers();
      setSelectedUsers(list.allowed_users || []);
      setError('');
    }
  }, [isOpen, list.allowed_users]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUserEmail || !newUserPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Check if user already exists
      const userQuery = query(collection(db, 'users'), where('email', '==', newUserEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        setError('User already exists');
        return;
      }

      // Create new user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);
      
      // Add user to Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: newUserEmail,
        isAdmin: false,
        created_at: new Date().toISOString()
      });

      // Refresh users list
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData.filter(user => !user.isAdmin));

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setIsAddingUser(false);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Error creating user');
    }
  };

  const handleSave = () => {
    onUpdatePermissions(selectedUsers);
    onClose();
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Manage Access</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add New User
            </button>
          </div>

          {isAddingUser && (
            <form onSubmit={handleAddNewUser} className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Create New User</h3>
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users found</p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                  >
                    <span className="text-sm">{user.email}</span>
                    <button
                      onClick={() => toggleUserSelection(user.uid)}
                      className={`p-1 rounded-md ${
                        selectedUsers.includes(user.uid)
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-green-500 hover:text-green-700'
                      }`}
                    >
                      {selectedUsers.includes(user.uid) ? (
                        <UserMinus size={20} />
                      ) : (
                        <UserPlus size={20} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}